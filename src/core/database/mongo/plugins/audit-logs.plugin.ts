import { Schema } from 'mongoose';
import { RequestContextStore } from 'src/core/context/request-context';
import { AuditAction } from 'src/shared/enums/app.enums';
import isEqual from 'lodash/isEqual';

const IGNORED_FIELDS = ['updatedAt', 'createdAt', '__v'];

export const auditPlugin = (schema: Schema, extra: { entity: string; primaryKey: string }) => {
  const { entity, primaryKey } = extra;

  /* ======================================================
   * CREATE (save)
   * ====================================================== */
  schema.post('save', function (doc: any) {
    const ctx = RequestContextStore.get();
    if (!ctx?.userId) return;

    const AuditLog = (doc.constructor as any).db.model('AuditLog');

    AuditLog.create({
      entity,
      entityId: doc[primaryKey] || doc._id.toString(),
      action: AuditAction.CREATE,
      after: doc.toObject(),
      performedBy: buildUser(ctx),
    }).catch(() => null);
  });

  /* ======================================================
   * CREATE (insertMany)
   * ====================================================== */
  schema.post('insertMany', function (docs: any[]) {
    const ctx = RequestContextStore.get();
    if (!ctx?.userId || !Array.isArray(docs)) return;

    const AuditLog = (docs[0]?.constructor as any).db.model('AuditLog');

    const logs = docs.map((doc) => ({
      entity,
      entityId: doc[primaryKey] || doc._id.toString(),
      action: AuditAction.CREATE,
      after: doc,
      performedBy: buildUser(ctx),
    }));

    AuditLog.insertMany(logs).catch(() => null);
  } as any);

  /* ======================================================
   * PRE UPDATE
   * ====================================================== */
  async function preUpdate(this: any) {
    const ctx = RequestContextStore.get();
    if (!ctx?.userId) return;

    const update: any = this.getUpdate();
    const set = update?.$set ?? update ?? {};

    const keys = Object.keys(set).filter((k) => !IGNORED_FIELDS.includes(k));

    if (!keys.length) return;

    const originalDocs = await this.model.find(this.getQuery()).lean();
    if (!originalDocs?.length) return;

    (this as any)._auditBefore = originalDocs.map((doc: any) => {
      const before: any = {};

      for (const key of keys) {
        before[key] = doc[key];
      }

      return {
        entityId: doc[primaryKey] || doc._id.toString(),
        before,
      };
    });
  }

  /* ======================================================
   * POST UPDATE
   * ====================================================== */
  function postUpdate(this: any) {
    const ctx = RequestContextStore.get();
    if (!ctx?.userId) return;

    const update: any = this.getUpdate();
    const set = update?.$set ?? update ?? {};

    const filteredAfter = Object.fromEntries(
      Object.entries(set).filter(([k]) => !IGNORED_FIELDS.includes(k)),
    );

    if (!Object.keys(filteredAfter).length) return;

    const AuditLog = (this.model as any).db.model('AuditLog');
    const beforeData = (this as any)._auditBefore || [];

    const logs = beforeData
      .map((item: any) => {
        const changedBefore: any = {};
        const changedAfter: any = {};

        for (const key of Object.keys(filteredAfter)) {
          if (!isEqual(item.before[key], filteredAfter[key])) {
            changedBefore[key] = item.before[key];
            changedAfter[key] = filteredAfter[key];
          }
        }

        // 🚫 Skip if no real change
        if (Object.keys(changedAfter).length === 0) {
          return null;
        }

        return {
          entity,
          entityId: item.entityId,

          action:
            changedAfter.isDeleted === true
              ? AuditAction.DELETE
              : changedAfter.isDeleted === false
                ? AuditAction.RESTORE
                : AuditAction.UPDATE,

          before: changedBefore,
          after: changedAfter,
          performedBy: buildUser(ctx),
        };
      })
      .filter(Boolean);

    if (logs.length) {
      AuditLog.insertMany(logs).catch(() => null);
    }
  }

  /* ======================================================
   * HOOKS
   * ====================================================== */
  schema.pre('updateOne', preUpdate);
  schema.post('updateOne', postUpdate);

  schema.pre('updateMany', preUpdate);
  schema.post('updateMany', postUpdate);

  schema.pre('findOneAndUpdate', preUpdate);
  schema.post('findOneAndUpdate', postUpdate);

  /* ======================================================
   * HELPER
   * ====================================================== */
  function buildUser(ctx: any) {
    return {
      userId: ctx.userId,
      profileId: ctx.profileId,
      name: ctx.name,
      roleId: ctx.roleId,
      roleName: ctx.roleName,
      deviceId: ctx.deviceId,
    };
  }
};

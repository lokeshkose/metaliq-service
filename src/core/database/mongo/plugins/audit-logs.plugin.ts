import { Schema } from 'mongoose';
import { RequestContextStore } from 'src/core/context/request-context';
import { AuditAction } from 'src/shared/enums/app.enums';

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
    }).catch((error) => console.log(error));
  });

  /* ======================================================
   * CREATE (insertMany)
   * ====================================================== */
  schema.post('insertMany', function (docs: any[]) {
    const ctx = RequestContextStore.get();

    console.log(ctx.userId);
    console.log(ctx.name);
    if (!ctx?.userId || !Array.isArray(docs)) return;

    const AuditLog = (docs[0]?.constructor as any).db.model('AuditLog');

    const logs = docs.map((doc) => ({
      entity,
      entityId: doc.customerId || doc.employeeId || doc._id.toString(),
      action: AuditAction.CREATE,
      after: doc,
      performedBy: buildUser(ctx),
    }));

    AuditLog.insertMany(logs).catch(() => null);
  } as any); // ✅ IMPORTANT FIX

  /* ======================================================
   * PRE UPDATE (shared)
   * ====================================================== */
  async function preUpdate(this: any) {
    const ctx = RequestContextStore.get();

    console.log(ctx.userId);
    console.log(ctx.name);
    if (!ctx?.userId) return;

    const update: any = this.getUpdate();
    const set = update?.$set ?? update ?? {};

    const keys = Object.keys(set).filter((k) => !IGNORED_FIELDS.includes(k));

    if (!keys.length) return;

    const original = await this.model.find(this.getQuery()).lean();
    if (!original?.length) return;

    (this as any)._auditBefore = original.map((doc: any) => {
      const before: any = {};
      for (const k of keys) {
        before[k] = doc[k];
      }
      return {
        entityId: doc.customerId || doc.employeeId || doc._id.toString(),
        before,
      };
    });
  }

  /* ======================================================
   * POST UPDATE (shared)
   * ====================================================== */
  function postUpdate(this: any) {
    const ctx = RequestContextStore.get();

    console.log(ctx.userId);
    console.log(ctx.name);
    if (!ctx?.userId) return;

    const update: any = this.getUpdate();
    const set = update?.$set ?? update ?? {};

    const after = Object.fromEntries(
      Object.entries(set).filter(([k]) => !IGNORED_FIELDS.includes(k)),
    );

    if (!Object.keys(after).length) return;

    const AuditLog = (this.model as any).db.model('AuditLog');

    const beforeData = (this as any)._auditBefore || [];

    const logs = beforeData.map((item: any) => ({
      entity,
      entityId: item.entityId,

      action:
        after.isDeleted === true
          ? AuditAction.DELETE
          : after.isDeleted === false
            ? AuditAction.RESTORE
            : AuditAction.UPDATE,

      before: item.before,
      after,
      performedBy: buildUser(ctx),
    }));

    if (logs.length) {
      AuditLog.insertMany(logs).catch(() => null);
    }
  }

  /* ======================================================
   * UPDATE HOOKS
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

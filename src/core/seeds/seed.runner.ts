import { Injectable } from '@nestjs/common';
import { RoleSeeder } from './role.seed';
import { SuperAdminSeeder } from './super-admin.seeds';
import { PermissionsSeeder } from './permission.seeds';
import { ProductSeeder } from './product.seeds';

@Injectable()
export class SeederRunner {
  constructor(
    private readonly roleSeeder: RoleSeeder,
    private readonly superAdminSeeder: SuperAdminSeeder,
    private readonly permissionSeeder: PermissionsSeeder,
    private readonly productSeeder: ProductSeeder,
  ) {}

  async run() {
    const { superAdminRoleId } = await this.roleSeeder.seed();
    await this.superAdminSeeder.seed(superAdminRoleId);
    await this.permissionSeeder.seed();
    await this.productSeeder.seedProductData();
  }
}

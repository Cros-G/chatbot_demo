import { Role, RoleCreateRequest } from '../types';
declare class RoleService {
    getAllRoles(): Promise<Role[]>;
    getRoleById(id: string): Promise<Role>;
    createRole(roleData: RoleCreateRequest): Promise<Role>;
    updateRole(id: string, roleData: RoleCreateRequest): Promise<Role>;
    deleteRole(id: string): Promise<void>;
    private buildRoleFromRow;
}
export declare const roleService: RoleService;
export {};
//# sourceMappingURL=roleService.d.ts.map
export interface BaseService<T, C = Omit<T, 'id'>> {
    getAll(params?: Record<string, string | number | boolean>): Promise<T[] | { data: T[], total: number }>;
    getById(id: number | string): Promise<T>;
    create(data: C): Promise<T>;
    update(id: number | string, data: Partial<T>): Promise<T>;
    delete(id: number | string): Promise<void>;
}

export interface PaginationParams {
    nro_pagina?: number;
    qtde_registros?: number;
    incluir_inativos?: 'S' | 'N';
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}

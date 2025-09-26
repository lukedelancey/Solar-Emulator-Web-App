import { PVModule, PVModuleCreate, PVModuleUpdate } from '../../types';

/**
 * Test data fixtures for consistent testing across all test suites
 * This file provides mock data that matches the expected API responses
 */
export const mockPVModule: PVModule = {
  id: 1,
  name: 'Test Solar Panel',
  voc: 45.6,
  isc: 9.2,
  vmp: 37.8,
  imp: 8.5,
  ns: 72,
  kv: -0.35,
  ki: 0.045,
  celltype: 'monoSi',
  gamma_pmp: -0.35,
};

export const mockPVModuleList: PVModule[] = [
  mockPVModule,
  {
    id: 2,
    name: 'SunPower SPR-300',
    voc: 64.2,
    isc: 5.96,
    vmp: 54.7,
    imp: 5.58,
    ns: 96,
    kv: -0.27,
    ki: 0.061,
    celltype: 'monoSi',
    gamma_pmp: -0.35,
  },
  {
    id: 3,
    name: 'Canadian Solar CS6K-280M',
    voc: 39.5,
    isc: 9.26,
    vmp: 31.7,
    imp: 8.83,
    ns: 60,
    kv: -0.31,
    ki: 0.053,
    celltype: 'multiSi',
    gamma_pmp: -0.35,
  },
];

export const mockPVModuleCreate: PVModuleCreate = {
  name: 'New Test Panel',
  voc: 42.0,
  isc: 8.5,
  vmp: 35.0,
  imp: 7.8,
  ns: 60,
  kv: -0.32,
  ki: 0.048,
  celltype: 'monoSi',
  gamma_pmp: -0.35,
};

export const mockPVModuleUpdate: PVModuleUpdate = {
  name: 'Updated Panel Name',
  voc: 43.5,
};

// Invalid test data for validation testing
export const invalidPVModuleCreate = {
  missing_name: {
    // name is missing
    voc: 42.0,
    isc: 8.5,
    vmp: 35.0,
    imp: 7.8,
    ns: 60,
    kv: -0.32,
    ki: 0.048,
    celltype: 'monoSi',
    gamma_pmp: -0.35,
  },
  invalid_numeric: {
    name: 'Test Panel',
    voc: 'not_a_number' as any,
    isc: 8.5,
    vmp: 35.0,
    imp: 7.8,
    ns: 60,
    kv: -0.32,
    ki: 0.048,
    celltype: 'monoSi',
    gamma_pmp: -0.35,
  },
  negative_values: {
    name: 'Test Panel',
    voc: -42.0, // Should be positive
    isc: 8.5,
    vmp: 35.0,
    imp: 7.8,
    ns: 60,
    kv: -0.32,
    ki: 0.048,
    celltype: 'monoSi',
    gamma_pmp: -0.35,
  },
  invalid_ns: {
    name: 'Test Panel',
    voc: 42.0,
    isc: 8.5,
    vmp: 35.0,
    imp: 7.8,
    ns: 60.5, // Should be integer
    kv: -0.32,
    ki: 0.048,
    celltype: 'monoSi',
    gamma_pmp: -0.35,
  },
  invalid_celltype: {
    name: 'Test Panel',
    voc: 42.0,
    isc: 8.5,
    vmp: 35.0,
    imp: 7.8,
    ns: 60,
    kv: -0.32,
    ki: 0.048,
    celltype: 'invalidType' as any, // Should be one of valid celltypes
    gamma_pmp: -0.35,
  },
};

// Mock API responses
export const mockApiResponses = {
  getAllModules: {
    data: mockPVModuleList,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  },
  getModuleById: {
    data: mockPVModule,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  },
  createModule: {
    data: { ...mockPVModuleCreate, id: 4 },
    status: 201,
    statusText: 'Created',
    headers: {},
    config: {} as any,
  },
  updateModule: {
    data: { ...mockPVModule, ...mockPVModuleUpdate },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  },
  deleteModule: {
    data: { detail: 'Module 1 deleted' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  },
};

// Mock error responses
export const mockErrorResponses = {
  notFound: {
    response: {
      status: 404,
      statusText: 'Not Found',
      data: { detail: 'Module not found' },
    },
    config: {} as any,
    isAxiosError: true,
    toJSON: () => ({}),
    name: 'AxiosError',
    message: 'Request failed with status code 404',
  },
  badRequest: {
    response: {
      status: 400,
      statusText: 'Bad Request',
      data: { detail: 'Module with this name already exists' },
    },
    config: {} as any,
    isAxiosError: true,
    toJSON: () => ({}),
    name: 'AxiosError',
    message: 'Request failed with status code 400',
  },
  networkError: {
    request: {},
    config: {} as any,
    isAxiosError: true,
    toJSON: () => ({}),
    name: 'AxiosError',
    message: 'Network Error',
  },
};
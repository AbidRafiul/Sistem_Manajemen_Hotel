export const apiEndpointGetRoomStatus = '/housekeeping/room-status-board';
export const apiEndpointAssignTask = (id: string) => `/housekeeping/tasks/${id}/assign`;
export const apiEndpointStartTask = (id: string) => `/housekeeping/tasks/${id}/start`;
export const apiEndpointCompleteTask = (id: string) => `/housekeeping/tasks/${id}/complete`;
export const apiEndpointVerifyTask = (id: string) => `/housekeeping/tasks/${id}/verify`;
export const apiEndpointCancelTask = (id: string) => `/housekeeping/tasks/${id}/cancel`;
export const apiEndpointGetUsers = '/setup/user-login/user-data';
export const apiEndpointGetHousekeepingStaff = '/housekeeping/staff';
export const apiEndpointGetHousekeepingHistory = '/housekeeping/history';
export const apiEndpointCreateTask = '/housekeeping/tasks';
export const apiEndpointUpdateChecklist = (id: string) => `/housekeeping/tasks/${id}/checklist`;
export const apiEndpointSubmitInspection = (id: string) => `/housekeeping/tasks/${id}/submit-inspection`;


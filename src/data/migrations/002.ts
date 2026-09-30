// Additive migration: existing packages and financial records remain unchanged.
export const migration2 = `
CREATE TABLE maintenanceContracts (
 id TEXT PRIMARY KEY NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
 title TEXT NOT NULL, clientId TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
 monthlyPrice REAL, currency TEXT NOT NULL, startDate TEXT NOT NULL, endDate TEXT,
 includedHours REAL, notes TEXT
);
CREATE INDEX idx_maintenanceContracts_clientId ON maintenanceContracts(clientId);
CREATE TABLE maintenanceReceipts (
 id TEXT PRIMARY KEY NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
 title TEXT NOT NULL, contractId TEXT NOT NULL REFERENCES maintenanceContracts(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
 paidAmount REAL, currency TEXT NOT NULL, date TEXT NOT NULL, notes TEXT
);
CREATE INDEX idx_maintenanceReceipts_contractId ON maintenanceReceipts(contractId);
`;

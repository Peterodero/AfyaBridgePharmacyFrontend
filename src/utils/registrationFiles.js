// Module-level store for File objects during registration.
// Files cannot go into Redux (not serializable).
// This map lives for the lifetime of the page session.
const fileStore = new Map();

export const setRegFile    = (key, file) => fileStore.set(key, file);
export const getRegFile    = (key)       => fileStore.get(key) || null;
export const clearRegFiles = ()          => fileStore.clear();

export const getAllRegFiles = () => ({
  id_document:            getRegFile('id_document'),
  practicing_license_doc: getRegFile('practicing_license_doc'),
  operating_license_doc:  getRegFile('operating_license_doc'),
  business_reg_cert:      getRegFile('business_reg_cert'),
  kra_pin_cert:           getRegFile('kra_pin_cert'),
  proof_of_address_doc:   getRegFile('proof_of_address_doc'),
});

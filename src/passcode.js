export const PASSCODE_ORG = {
  whatsapp: '919318483909',
  guestCode: '0000',
  orgs: [
    { code: '2023', domain: 'https://server2.sudoyantra.com', label: 'Admin' },
    { code: '2100', domain: 'hpcl', label: 'HPCL Delhi' },
    { code: '1234', domain: 'carbantis', label: 'Carbantis' },
  ],
}

export function findOrgByCode(code) {
  return PASSCODE_ORG.orgs.find((o) => o.code === code) || null
}

export function resolvePasscode(code) {
  if (code === PASSCODE_ORG.guestCode) return { guest: true, org: null }
  const org = findOrgByCode(code)
  return org ? { guest: false, org } : null
}

export function forgotPasscodeUrl() {
  const text = 'Hi SudoYantra, I forgot my dashboard passcode. Please share my organization\u2019s passcode.'
  return `https://wa.me/${PASSCODE_ORG.whatsapp}?text=${encodeURIComponent(text)}`
}

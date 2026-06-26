/** Build profile edit form + PATCH payload for union-admin members */

import { memberMobile, memberName } from './memberDisplay'

export const NOMINEE_RELATIONS = [
  'SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'OTHER',
]

export const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER']

export function memberToProfileForm(member) {
  if (!member) return emptyProfileForm()
  const mobile = member.mobileNumber || member.user?.mobileNumber
  const mobileStr = mobile && String(mobile) !== '—' ? String(mobile) : ''
  return {
    fullName: member.fullName || memberName(member) || '',
    fatherName: member.fatherName || '',
    mobileNumber: mobileStr,
    email: member.email || member.user?.email || '',
    dob: member.dob ? String(member.dob).split('T')[0] : '',
    gender: member.gender || '',
    designation: member.designation || member.currentDesignation || '',
    currentNewspaper: member.currentNewspaper || member.organization || '',
    publisherMobileNumber: member.publisherMobileNumber || '',
    workingArea: member.workingArea || '',
    state: member.state || '',
    district: member.district || '',
    mandal: member.mandal || '',
    addressLine: member.addressLine || member.address?.line1 || '',
    stateId: member.stateId || '',
    districtId: member.districtId || '',
    nomineeName: member.nomineeName || '',
    nomineeRelation: member.nomineeRelation || '',
    nomineeMobile: member.nomineeMobile || member.nomineeMobileNumber || '',
  }
}

export function emptyProfileForm() {
  return {
    fullName: '',
    fatherName: '',
    mobileNumber: '',
    email: '',
    dob: '',
    gender: '',
    designation: '',
    currentNewspaper: '',
    publisherMobileNumber: '',
    workingArea: '',
    state: '',
    district: '',
    mandal: '',
    addressLine: '',
    stateId: '',
    districtId: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeMobile: '',
  }
}

/** PATCH body — only non-empty fields; never sends `mobile` (use mobileNumber). */
export function buildProfilePatch(form) {
  const body = {}
  const set = (key, val) => {
    const v = typeof val === 'string' ? val.trim() : val
    if (v !== '' && v != null) body[key] = v
  }

  set('fullName', form.fullName)
  set('fatherName', form.fatherName)
  set('mobileNumber', String(form.mobileNumber || '').replace(/\D/g, ''))
  set('email', form.email)
  set('dob', form.dob)
  set('gender', form.gender)
  set('designation', form.designation)
  set('currentNewspaper', form.currentNewspaper)
  set('publisherMobileNumber', String(form.publisherMobileNumber || '').replace(/\D/g, ''))
  set('workingArea', form.workingArea)
  set('state', form.state)
  set('district', form.district)
  set('mandal', form.mandal)
  set('addressLine', form.addressLine)
  set('stateId', form.stateId)
  set('districtId', form.districtId)
  set('nomineeName', form.nomineeName)
  set('nomineeRelation', form.nomineeRelation)
  set('nomineeMobile', String(form.nomineeMobile || '').replace(/\D/g, ''))

  return body
}

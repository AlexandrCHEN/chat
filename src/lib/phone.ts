import parsePhoneNumberFromString, { isPossiblePhoneNumber } from 'libphonenumber-js'

type PhoneParseSuccess = {
  e164: string
  valid: true
}

type PhoneParseFailure = {
  error: 'format' | 'number'
  valid: false
}

export type PhoneParseResult = PhoneParseSuccess | PhoneParseFailure

export function filterPhoneInput(value: string): string {
  return Array.from(value).reduce((result, character) => {
    if (/\d/.test(character)) {
      return result + character
    }

    if (character === '+' && result.length === 0) {
      return character
    }

    return result
  }, '')
}

export function parsePhone(value: string): PhoneParseResult {
  if (!value.startsWith('+')) {
    return { error: 'format', valid: false }
  }

  if (!isPossiblePhoneNumber(value)) {
    return { error: 'number', valid: false }
  }

  const phoneNumber = parsePhoneNumberFromString(value)

  if (!phoneNumber) {
    return { error: 'number', valid: false }
  }

  return { e164: phoneNumber.number, valid: true }
}

export function toChatId(e164: string): string {
  return `${e164.slice(1)}@c.us`
}

export function fromChatId(chatId: string): string | null {
  const match = /^(\d+)@c\.us$/.exec(chatId)

  if (!match) {
    return null
  }

  const result = parsePhone(`+${match[1]}`)
  return result.valid ? result.e164 : null
}

export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164
}

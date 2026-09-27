export type Credentials = {
  idInstance: string
  apiTokenInstance: string
}

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export type Message =
  | { id: string; direction: 'incoming'; text: string; timestamp: number }
  | { id: string; direction: 'outgoing'; text: string; timestamp: number; status: MessageStatus }

export type Chat = {
  chatId: string
  phoneNumber: string
  messages: Message[]
}

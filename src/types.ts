export type Credentials = {
  idInstance: string
  apiTokenInstance: string
}

export type Message = {
  id: string
  direction: 'incoming' | 'outgoing'
  text: string
  timestamp: number
}

export type Chat = {
  chatId: string
  phoneNumber: string
  messages: Message[]
}

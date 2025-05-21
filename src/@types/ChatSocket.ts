export interface IparticipantIds {
  senderId: string;
  receiverId: string;
}
export type MessagePayload = IparticipantIds & {
  text?: string;
  file?: string[];
  replyToMessage?: string;
  chatId: string;
  voise?: string[];
};
export type DeleteChat = IparticipantIds & {
  chatId: string;
};
export type DeleteMessage = DeleteChat & {
  MessageId: string;
};
export type EditMessage = IparticipantIds & {
  MessageId: string;
  text: string;
  chatId: string;
};
export type EmojiSend = IparticipantIds & {
  emoji: string;
  chatId: string;
  messageId: string;
};
export type LoadMessages = {
  chatId: string;
  skip: number;
};

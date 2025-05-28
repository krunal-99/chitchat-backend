import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Message } from "./Message";
import { Conversation } from "./Conversation";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  image_url: string;

  @Column({ type: "varchar", length: 100 })
  user_name: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "boolean", default: false })
  is_online: boolean;

  @OneToMany(() => Message, (message) => message.sender)
  sent_messages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  received_messages: Message[];

  @OneToMany(() => Conversation, (conversation) => conversation.user1)
  conversations_as_user1: Conversation[];

  @OneToMany(() => Conversation, (conversation) => conversation.user2)
  conversations_as_user2: Conversation[];
}

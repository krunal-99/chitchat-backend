import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  text: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, (user) => user.sent_messages, { onDelete: "CASCADE" })
  @Index()
  sender: User;

  @ManyToOne(() => User, (user) => user.received_messages, {
    onDelete: "CASCADE",
  })
  @Index()
  receiver: User;
}

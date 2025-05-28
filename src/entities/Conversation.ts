import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
@Index(["user1", "user2"], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.conversations_as_user1, {
    onDelete: "CASCADE",
  })
  user1: User;

  @ManyToOne(() => User, (user) => user.conversations_as_user2, {
    onDelete: "CASCADE",
  })
  user2: User;

  @Column({ type: "text", nullable: true })
  last_message: string;

  @Column({ type: "timestamp", nullable: true })
  last_message_time: Date;
}

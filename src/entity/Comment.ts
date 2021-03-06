import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Post } from './Post';
import { User } from './User';

@Entity()
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn({ name: 'commentId' })
  id: number;

  @ManyToOne(() => Post, (post) => post.comments, {
    primary: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  post: Post;

  @Column({ name: 'postId' })
  postId: number;

  @Column({ name: 'commentBody', length: 180 })
  body: string;

  @CreateDateColumn({ name: 'createdDate' })
  created: Date;

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: User;
}

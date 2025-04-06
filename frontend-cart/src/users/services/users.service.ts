import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async findOne(name: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOne({ where: { name } });
  }

  async createOne({ name, password }): Promise<UserEntity> {
    this.usersRepository.create({ name, password });
    return await this.usersRepository.save({
      name,
      password,
    });
  }
}

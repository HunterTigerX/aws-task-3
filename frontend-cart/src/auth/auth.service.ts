import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { User } from '../users/models';
import { UserEntity } from 'src/users/entities/users.entity';
import { userDto } from 'src/users/dto/user.dto';

type TokenResponse = {
  token_type: string;
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(payload: userDto): Promise<{ userId: string }> {
    console.log('Registering');
    const user = this.usersService.findOne(payload.email);
    console.log('user', user);
    if (user) {
      throw new BadRequestException('User with such name already exists');
    }
    const result = {
      name: payload.email,
      password: payload.password,
    };

    const newUser = await this.usersService.createOne(result);
    return { userId: newUser.id };
  }

  async validateUser(name: string, password: string): Promise<UserEntity> {
    const user = this.usersService.findOne(name);

    if (user) {
      return user;
    }

    return this.usersService.createOne({ name, password } as User);
  }

  async login(
    user: User,
    type: 'jwt' | 'basic' | 'default',
  ): Promise<TokenResponse> {
    const LOGIN_MAP = {
      jwt: this.loginJWT,
      basic: this.loginBasic,
      default: this.loginJWT,
    };
    const login = LOGIN_MAP[type];

    return login ? login(user) : LOGIN_MAP.default(user);
  }

  async loginJWT(user: User) {
    const payload = { username: user.name, sub: user.id };

    return {
      token_type: 'Bearer',
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginBasic(user: User) {
    // const payload = { username: user.name, sub: user.id };
    console.log('loginBasic user', user);

    function encodeUserToken(user: User) {
      const { name, password } = user;
      const buf = Buffer.from([name, password].join(':'), 'utf8');

      return buf.toString('base64');
    }

    return {
      token_type: 'Basic',
      access_token: encodeUserToken(user),
    };
  }
}

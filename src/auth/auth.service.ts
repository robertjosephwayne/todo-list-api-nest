import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from 'src/users/repositories/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersRepository.findByEmail(username);
    let isPasswordMatching = false;
    if (user) {
      isPasswordMatching = await bcrypt.compare(password, user.password);
    }
    if (user && isPasswordMatching) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const userDoc = user._doc;
    const payload = { username: userDoc.email, sub: userDoc._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.findByEmail(createUserDto.email);
    if (user) throw new ConflictException();
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const payload = {
      username: createdUser.email,
      sub: createdUser._id,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

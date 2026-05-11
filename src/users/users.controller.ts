import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRol } from 'src/entities/rol.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRol.SUPERVISOR)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRol.SUPERVISOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRol.SUPERVISOR)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRol.SUPERVISOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRol.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRol.SUPERVISOR)
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() actingUser: User,
  ) {
    return this.usersService.deactivateUser(id, actingUser);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRol.SUPERVISOR)
  async reactivate(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() actingUser: User,
  ) {
    return this.usersService.reactivateUser(id, actingUser);
  }
}

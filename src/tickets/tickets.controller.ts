import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UserRol } from 'src/entities/rol.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTicketDto: CreateTicketDto, @GetUser() user: User) {
    return this.ticketsService.create(createTicketDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser() user: User) {
    return this.ticketsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ticketsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.update(id, updateTicketDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRol.SUPERVISOR)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ticketsService.remove(id, user);
  }

  @Patch(':id/claim')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRol.SOPORTISTA, UserRol.SUPERVISOR)
  async claim(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ticketsService.claim(id, user);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRol.SUPERVISOR)
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body('soportistaId') soportistaId: number,
    @GetUser() user: User,
  ) {
    return this.ticketsService.assignTo(id, soportistaId, user);
  }
}

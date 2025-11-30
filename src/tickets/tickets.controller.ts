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
  Req,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Logger,
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
import * as fs from 'fs';
import { extname, join } from 'path';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('tickets')
export class TicketsController {
  logger = new Logger('TicketsController');
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

  // ---------------------------
  // Endpoint para subir evidencias
  // ---------------------------
  @Patch(':id/evidence')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const safeName = (file.originalname || '')
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9.\-_]/g, '');
          cb(null, `${uniqueSuffix}-${safeName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedExt = ['.jpeg', '.jpg', '.png', '.gif', '.pdf'];
        const ext = extname(file.originalname || '').toLowerCase();
        cb(null, allowedExt.includes(ext));
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
    }),
  )
  async uploadEvidence(
    @Param('id') id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      this.logger.warn(`[uploadEvidence] no files received for ticket ${id}`);
      throw new BadRequestException(
        'No files received. Ensure the form field is named "files" and files meet allowed types/size.',
      );
    }

    const baseUrl =
      process.env.APP_BASE_URL ||
      `http://localhost:${process.env.PORT || 4200}`;
    const urls = (files || []).map((f) => `${baseUrl}/uploads/${f.filename}`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      return await this.ticketsService.saveEvidence(Number(id), urls, req.user);
    } catch (err) {
      // On permission or other errors, remove uploaded files to avoid orphans
      try {
        for (const f of files || []) {
          const p = join(process.cwd(), 'uploads', f.filename);
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            this.logger.debug(
              `[uploadEvidence] deleted uploaded file after error: ${p}`,
            );
          }
        }
      } catch (cleanupErr) {
        this.logger.error(
          '[uploadEvidence] error during cleanup of uploaded files',
          cleanupErr,
        );
      }
      this.logger.error(
        `[uploadEvidence] error saving evidence for ticket ${id}`,
        err,
      );
      // Re-throw a safe error for client
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(err?.message || 'Failed to save evidence.');
    }
  }
}

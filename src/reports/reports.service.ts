import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tickets } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async ticketsByStatus() {
    const result = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('ticket.status')
      .getRawMany();

    return result.map((r: { status: string; count: string }) => ({
      status: r.status,
      count: Number(r.count),
    }));
  }

  async ticketsByUser() {
    const result = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.nombreCompleto', 'nombreCompleto')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('user.id')
      .addGroupBy('user.nombreCompleto')
      .getRawMany();

    return result.map(
      (r: { userId: number; nombreCompleto: string; count: string }) => ({
        userId: r.userId,
        nombreCompleto: r.nombreCompleto,
        count: Number(r.count),
      }),
    );
  }

  async ticketsBySoportista() {
    const result = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.assignedTo', 'soportista')
      .select('soportista.id', 'soportistaId')
      .addSelect('soportista.nombreCompleto', 'nombreCompleto')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('soportista.id')
      .addGroupBy('soportista.nombreCompleto')
      .getRawMany();

    return result.map(
      (r: { soportistaId: number; nombreCompleto: string; count: string }) => ({
        soportistaId: r.soportistaId,
        nombreCompleto: r.nombreCompleto,
        count: Number(r.count),
      }),
    );
  }

  async summary() {
    // 1. Contar total de tickets
    const total = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .getCount();

    // 2. Contar tickets asignados (assignedTo NO es null)
    const assignedCount = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .where('ticket.assigned_id IS NOT NULL')
      .getCount();

    // 3. Calcular tickets sin asignar
    const unassignedCount = total - assignedCount;

    // 4. Obtener desglose por estado
    const byStatus = await this.ticketsByStatus();

    // 5. Retornar todo junto
    return {
      total,
      assignedCount,
      unassignedCount,
      byStatus,
    };
  }
}

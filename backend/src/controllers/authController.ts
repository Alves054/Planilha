import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateToken, AuthUser } from '../middlewares/authMiddleware.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Suporta comparação com hash bcrypt ou fallback para senha plana inicial
    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    const isPlainMatch = user.password === password;

    if (!isMatch && !isPlainMatch) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'COACH' | 'ATHLETE'
    };

    const token = generateToken(authUser);

    return res.json({
      success: true,
      token,
      user: authUser
    });
  } catch (error: any) {
    console.error('[AUTH LOGIN] Erro:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const authUser = (req as any).user as AuthUser;
    if (!authUser) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        notes: true,
        paceLeve: true,
        paceModerado: true,
        paceControlado: true,
        paceTiros: true,
        coachId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
}

export async function listAthletes(req: Request, res: Response) {
  try {
    const athletes = await prisma.user.findMany({
      where: { role: 'ATHLETE' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        paceLeve: true,
        paceModerado: true,
        paceControlado: true,
        paceTiros: true,
        createdAt: true,
        weeks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            plannedVolumeKm: true,
            startDate: true,
            endDate: true,
            status: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = athletes.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      notes: a.notes,
      paceLeve: a.paceLeve || '5:10–5:40/km',
      paceModerado: a.paceModerado || '4:40–5:10/km',
      paceControlado: a.paceControlado || '3:50–4:10/km',
      paceTiros: a.paceTiros || '3:00–3:30/km',
      createdAt: a.createdAt,
      latestWeek: a.weeks[0] || null
    }));

    return res.json({ athletes: formatted });
  } catch (error: any) {
    console.error('[LIST ATHLETES] Erro:', error);
    return res.status(500).json({ error: 'Erro ao listar alunos.' });
  }
}

export async function createAthlete(req: Request, res: Response) {
  try {
    const coach = (req as any).user as AuthUser;
    const { name, email, password, phone, notes, paceLeve, paceModerado, paceControlado, paceTiros } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe um aluno ou usuário cadastrado com este e-mail.' });
    }

    const rawPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const athlete = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ATHLETE',
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        paceLeve: paceLeve?.trim() || '5:10–5:40/km',
        paceModerado: paceModerado?.trim() || '4:40–5:10/km',
        paceControlado: paceControlado?.trim() || '3:50–4:10/km',
        paceTiros: paceTiros?.trim() || '3:00–3:30/km',
        coachId: coach?.id || null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Aluno criado com sucesso!',
      athlete: {
        id: athlete.id,
        name: athlete.name,
        email: athlete.email,
        phone: athlete.phone,
        notes: athlete.notes,
        paceLeve: athlete.paceLeve,
        paceModerado: athlete.paceModerado,
        paceControlado: athlete.paceControlado,
        paceTiros: athlete.paceTiros,
        role: athlete.role
      }
    });
  } catch (error: any) {
    console.error('[CREATE ATHLETE] Erro:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar aluno.' });
  }
}

export async function updateAthlete(req: Request, res: Response) {
  try {
    const athleteId = String(req.params.id);
    const { name, email, password, phone, notes, paceLeve, paceModerado, paceControlado, paceTiros } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (email) dataToUpdate.email = email.trim().toLowerCase();
    if (phone !== undefined) dataToUpdate.phone = phone?.trim() || null;
    if (notes !== undefined) dataToUpdate.notes = notes?.trim() || null;
    if (paceLeve !== undefined) dataToUpdate.paceLeve = paceLeve?.trim() || '5:10–5:40/km';
    if (paceModerado !== undefined) dataToUpdate.paceModerado = paceModerado?.trim() || '4:40–5:10/km';
    if (paceControlado !== undefined) dataToUpdate.paceControlado = paceControlado?.trim() || '3:50–4:10/km';
    if (paceTiros !== undefined) dataToUpdate.paceTiros = paceTiros?.trim() || '3:00–3:30/km';
    if (password && password.trim().length >= 4) {
      dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: athleteId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        notes: true,
        paceLeve: true,
        paceModerado: true,
        paceControlado: true,
        paceTiros: true,
        role: true
      }
    });

    return res.json({
      success: true,
      message: 'Dados do aluno atualizados com sucesso.',
      athlete: updated
    });
  } catch (error: any) {
    console.error('[UPDATE ATHLETE] Erro:', error);
    return res.status(500).json({ error: 'Erro ao atualizar aluno.' });
  }
}

export async function updatePaceZones(req: Request, res: Response) {
  try {
    const athleteId = String(req.params.id);
    const { paceLeve, paceModerado, paceControlado, paceTiros } = req.body;

    const updated = await prisma.user.update({
      where: { id: athleteId },
      data: {
        paceLeve: paceLeve ? String(paceLeve).trim() : undefined,
        paceModerado: paceModerado ? String(paceModerado).trim() : undefined,
        paceControlado: paceControlado ? String(paceControlado).trim() : undefined,
        paceTiros: paceTiros ? String(paceTiros).trim() : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        paceLeve: true,
        paceModerado: true,
        paceControlado: true,
        paceTiros: true
      }
    });

    return res.json({
      success: true,
      message: 'Zonas de ritmo do aluno atualizadas com sucesso!',
      athlete: updated
    });
  } catch (error: any) {
    console.error('[UPDATE PACE ZONES] Erro:', error);
    return res.status(500).json({ error: 'Erro ao atualizar zonas de ritmo.' });
  }
}

export async function deleteAthlete(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    await prisma.user.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Aluno excluído com sucesso.'
    });
  } catch (error: any) {
    console.error('[DELETE ATHLETE] Erro:', error);
    return res.status(500).json({ error: 'Erro ao excluir aluno.' });
  }
}

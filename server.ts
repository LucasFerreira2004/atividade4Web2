import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose, { Model, Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pessoas';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.set('strictQuery', false);

interface IPessoa {
  nome: string;
  email: string;
  altura: number;
  peso: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const pessoaSchema = new Schema<IPessoa>(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    altura: {
      type: Number,
      required: true,
      min: 0,
    },
    peso: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Pessoa: Model<IPessoa> = mongoose.model<IPessoa>('Pessoa', pessoaSchema);

app.get('/pessoas', async (req: Request, res: Response) => {
  try {
    const { nome, email } = req.query as { nome?: string; email?: string };
    const filtro: Record<string, unknown> = {};

    if (nome) {
      filtro.nome = { $regex: nome, $options: 'i' };
    }

    if (email) {
      filtro.email = { $regex: email, $options: 'i' };
    }

    const pessoas = await Pessoa.find(filtro).sort({ createdAt: -1 });
    res.json(pessoas);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ mensagem: 'Erro ao listar pessoas', erro: err.message });
  }
});

app.get('/pessoas/:id', async (req: Request, res: Response) => {
  try {
    const pessoa = await Pessoa.findById(req.params.id);

    if (!pessoa) {
      return res.status(404).json({ mensagem: 'Pessoa não encontrada.' });
    }

    return res.json(pessoa);
  } catch (error) {
    const err = error as Error;
    return res.status(400).json({ mensagem: 'ID inválido', erro: err.message });
  }
});

app.post('/pessoas', async (req: Request, res: Response) => {
  try {
    const { nome, email, altura, peso } = req.body as {
      nome?: string;
      email?: string;
      altura?: number;
      peso?: number;
    };

    if (!nome || !email || altura === undefined || peso === undefined) {
      return res.status(400).json({
        mensagem: 'Preencha nome, email, altura e peso.',
      });
    }

    const novaPessoa = new Pessoa({
      nome,
      email,
      altura,
      peso,
    });

    const pessoaSalva = await novaPessoa.save();
    return res.status(201).json({
      pessoa: pessoaSalva,
    });
  } catch (error) {
    const err = error as { code?: number; message?: string };

    if (err.code === 11000) {
      return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
    }

    return res.status(400).json({ mensagem: 'Erro ao cadastrar pessoa', erro: err.message });
  }
});

app.put('/pessoas/:id', async (req: Request, res: Response) => {
  try {
    const { nome, email, altura, peso } = req.body as {
      nome?: string;
      email?: string;
      altura?: number;
      peso?: number;
    };

    const pessoaAtualizada = await Pessoa.findByIdAndUpdate(
      req.params.id,
      { nome, email, altura, peso },
      { new: true, runValidators: true }
    );

    if (!pessoaAtualizada) {
      return res.status(404).json({ mensagem: 'Pessoa não encontrada.' });
    }

    return res.json({
      pessoa: pessoaAtualizada,
    });
  } catch (error) {
    const err = error as { code?: number; message?: string };

    if (err.code === 11000) {
      return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
    }

    return res.status(500).json({ mensagem: 'Erro ao atualizar pessoa', erro: err.message });
  }
});

app.delete('/pessoas/:id', async (req: Request, res: Response) => {
  try {
    const pessoaExcluida = await Pessoa.findByIdAndDelete(req.params.id);

    if (!pessoaExcluida) {
      return res.status(404).json({ mensagem: 'Pessoa não encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ mensagem: 'Erro ao excluir pessoa', erro: err.message });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ mensagem: 'Erro interno do servidor', erro: err.message });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Conectado ao MongoDB em:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  });

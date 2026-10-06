"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importStar(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pessoas';
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
mongoose_1.default.set('strictQuery', false);
const pessoaSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
const Pessoa = mongoose_1.default.model('Pessoa', pessoaSchema);
app.get('/pessoas', async (req, res) => {
    try {
        const { nome, email } = req.query;
        const filtro = {};
        if (nome) {
            filtro.nome = { $regex: nome, $options: 'i' };
        }
        if (email) {
            filtro.email = { $regex: email, $options: 'i' };
        }
        const pessoas = await Pessoa.find(filtro).sort({ createdAt: -1 });
        res.json(pessoas);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ mensagem: 'Erro ao listar pessoas', erro: err.message });
    }
});
app.get('/pessoas/:id', async (req, res) => {
    try {
        const pessoa = await Pessoa.findById(req.params.id);
        if (!pessoa) {
            return res.status(404).json({ mensagem: 'Pessoa não encontrada.' });
        }
        return res.json(pessoa);
    }
    catch (error) {
        const err = error;
        return res.status(400).json({ mensagem: 'ID inválido', erro: err.message });
    }
});
app.post('/pessoas', async (req, res) => {
    try {
        const { nome, email, altura, peso } = req.body;
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
    }
    catch (error) {
        const err = error;
        if (err.code === 11000) {
            return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
        }
        return res.status(400).json({ mensagem: 'Erro ao cadastrar pessoa', erro: err.message });
    }
});
app.put('/pessoas/:id', async (req, res) => {
    try {
        const { nome, email, altura, peso } = req.body;
        const pessoaAtualizada = await Pessoa.findByIdAndUpdate(req.params.id, { nome, email, altura, peso }, { new: true, runValidators: true });
        if (!pessoaAtualizada) {
            return res.status(404).json({ mensagem: 'Pessoa não encontrada.' });
        }
        return res.json({
            pessoa: pessoaAtualizada,
        });
    }
    catch (error) {
        const err = error;
        if (err.code === 11000) {
            return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
        }
        return res.status(500).json({ mensagem: 'Erro ao atualizar pessoa', erro: err.message });
    }
});
app.delete('/pessoas/:id', async (req, res) => {
    try {
        const pessoaExcluida = await Pessoa.findByIdAndDelete(req.params.id);
        if (!pessoaExcluida) {
            return res.status(404).json({ mensagem: 'Pessoa não encontrada.' });
        }
        return res.status(204).send();
    }
    catch (error) {
        const err = error;
        return res.status(500).json({ mensagem: 'Erro ao excluir pessoa', erro: err.message });
    }
});
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ mensagem: 'Erro interno do servidor', erro: err.message });
});
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log('Conectado ao MongoDB em:', MONGO_URI);
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
});

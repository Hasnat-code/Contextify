# Contextify

A powerful **Retrieval-Augmented Generation (RAG) Based System** designed to enhance AI applications with contextual information retrieval and intelligent response generation.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## 🎯 Overview

Contextify is a RAG-based system that combines information retrieval with generative AI models to provide accurate, context-aware responses. It retrieves relevant documents from a knowledge base and uses them to augment language model prompts for improved accuracy and relevance.

### Key Benefits

- **Improved Accuracy**: Augments AI responses with factual information from your knowledge base
- **Reduced Hallucinations**: Grounds responses in actual documents
- **Scalable Architecture**: Handle large document collections efficiently
- **Real-time Processing**: Fast retrieval and response generation

## ✨ Features

- 📚 **Document Ingestion**: Support for multiple document formats (PDF, TXT, DOCX, etc.)
- 🔍 **Semantic Search**: Advanced retrieval using embeddings and similarity matching
- 🤖 **AI-Powered Generation**: Integration with language models for intelligent responses
- 💾 **Vector Database**: Efficient storage and retrieval of document embeddings
- ⚡ **Performance Optimized**: Fast query processing with caching mechanisms
- 🔐 **Secure**: API key management and request validation
- 📊 **Analytics**: Track queries and system performance

## 🛠 Technology Stack

### Backend
- **Python 3.8+** - Core programming language
- **FastAPI** - Modern web framework
- **LangChain** - LLM orchestration framework
- **Pinecone/Weaviate/FAISS** - Vector database solutions
- **Pydantic** - Data validation

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### LLM & Embeddings
- **OpenAI API** - GPT models and embeddings
- **Hugging Face** - Open-source models (optional)
- **Anthropic Claude** - Alternative LLM provider (optional)

## 📋 Requirements

### System Requirements

- **OS**: Linux, macOS, or Windows
- **Python**: 3.8 or higher
- **Node.js**: 16 or higher (for frontend)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 20GB+ for vector database

### Dependencies

#### Backend Dependencies
```
fastapi>=0.104.0
uvicorn>=0.24.0
langchain>=0.1.0
python-dotenv>=1.0.0
pydantic>=2.0.0
requests>=2.31.0
aiofiles>=23.2.0
```

#### Vector Database Options
```
pinecone-client>=3.0.0  # For Pinecone
weaviate-client>=4.0.0  # For Weaviate
faiss-cpu>=1.7.0        # For FAISS (lightweight option)
```

#### LLM & Embedding Models
```
openai>=1.3.0
langchain-openai>=0.0.2
sentence-transformers>=2.2.0
```

#### Frontend Dependencies
```
react>=18.0.0
typescript>=5.0.0
tailwindcss>=3.0.0
axios>=1.6.0
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# LLM Configuration
OPENAI_API_KEY=your_openai_api_key
MODEL_NAME=gpt-4

# Vector Database
VECTOR_DB_TYPE=pinecone  # or weaviate, faiss
VECTOR_DB_HOST=your_db_host
VECTOR_DB_API_KEY=your_db_api_key
VECTOR_DB_INDEX=contextify

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0
LOG_LEVEL=INFO

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Installation

### Prerequisites

Ensure you have the following installed:
- Python 3.8+
- Node.js 16+
- Git
- pip (Python package manager)
- npm (Node package manager)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Hasnat-code/Contextify.git
   cd Contextify
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize the database**
   ```bash
   python scripts/init_db.py
   ```

6. **Start the backend server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## ⚙️ Configuration

### Vector Database Configuration

#### Pinecone Setup
```python
from langchain.vectorstores import Pinecone

vector_store = Pinecone.from_documents(
    documents=documents,
    embedding=embeddings,
    index_name="contextify",
    namespace="production"
)
```

#### FAISS Setup (Local)
```python
from langchain.vectorstores import FAISS

vector_store = FAISS.from_documents(
    documents=documents,
    embedding=embeddings
)
vector_store.save_local("faiss_index")
```

### LLM Configuration

```python
from langchain.chat_models import ChatOpenAI

llm = ChatOpenAI(
    model_name="gpt-4",
    temperature=0.7,
    max_tokens=2000
)
```

## 📖 Usage

### Basic Query

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the capital of France?",
    "top_k": 5
  }'
```

### Document Upload

```bash
curl -X POST http://localhost:8000/api/documents/upload \
  -F "file=@document.pdf" \
  -F "metadata={\"source\": \"manual\"}"
```

### Python Client Example

```python
from contextify import Client

client = Client(api_url="http://localhost:8000")

# Query the system
response = client.query(
    text="What is machine learning?",
    top_k=5,
    temperature=0.7
)

print(response.answer)
print(response.sources)
```

## 📁 Project Structure

```
Contextify/
├── backend/
│   ├── main.py                 # Application entry point
│   ├── config.py              # Configuration management
│   ├── requirements.txt        # Python dependencies
│   ├── app/
│   │   ├── api/
│   │   │   ├── query.py       # Query endpoints
│   │   │   ├── documents.py   # Document management
│   │   │   └── health.py      # Health check
│   │   ├── services/
│   │   │   ├── retrieval.py   # Document retrieval logic
│   │   │   ├── generation.py  # Response generation
│   │   │   └── embeddings.py  # Embedding generation
│   │   └── models/
│   │       └── schemas.py     # Pydantic models
│   └── scripts/
│       └── init_db.py         # Database initialization
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├��─ pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── styles/            # CSS files
│   │   └── App.tsx            # Main app component
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript config
│
├── docs/                      # Documentation
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore file
└── README.md                 # This file
```

## 🔌 API Documentation

### Endpoints

#### Query
- **POST** `/api/query` - Submit a query
  - Request body:
    ```json
    {
      "query": "Your question here",
      "top_k": 5,
      "temperature": 0.7
    }
    ```

#### Documents
- **POST** `/api/documents/upload` - Upload documents
- **GET** `/api/documents` - List documents
- **DELETE** `/api/documents/{doc_id}` - Delete document

#### Health
- **GET** `/api/health` - Health check

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript/TypeScript
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation in the `/docs` folder

## 🎓 Resources

- [LangChain Documentation](https://python.langchain.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [RAG Best Practices](https://docs.openai.com/guides/rag)

## 📈 Roadmap

- [ ] Multi-language support
- [ ] Advanced caching strategies
- [ ] Fine-tuning capabilities
- [ ] Analytics dashboard
- [ ] Batch query processing
- [ ] Custom model deployment

---

**Made with ❤️ by Hasnat-code**

Last Updated: May 2026

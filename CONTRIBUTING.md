# Contributing to ChronosAI

Thank you for your interest in contributing to ChronosAI! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/ChronosAI.git
   cd ChronosAI
   ```

2. **Set up your development environment**
   ```bash
   # Copy environment variables
   cp .env.example .env
   
   # Edit .env with your development configuration
   # Set up database, OAuth credentials, etc.
   ```

3. **Start development services**
   ```bash
   # Start with Docker Compose
   docker-compose -f deployment/docker-compose.yml up -d
   
   # Or run services manually:
   # Backend: cd backend && uvicorn app.main:app --reload
   # Frontend: cd frontend && npm start
   ```

4. **Verify setup**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

## 📋 Development Guidelines

### Code Style

#### Python (Backend)
- Follow PEP 8 style guidelines
- Use Black for code formatting
- Use flake8 for linting
- Use isort for import sorting

```bash
# Format code
black backend/
isort backend/

# Lint code
flake8 backend/
```

#### JavaScript/TypeScript (Frontend)
- Use ESLint for linting
- Use Prettier for formatting
- Follow React best practices

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   # Follow Conventional Commits specification
   git commit -m "feat: add new calendar integration feature"
   ```

4. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

### Commit Message Format

We use the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OAuth refresh token rotation
fix(calendar): resolve Google Calendar API scope issue
docs(readme): update installation instructions
```

## 🧪 Testing

### Running Tests

#### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

#### Frontend Tests
```bash
cd frontend

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Coverage Requirements

- **Backend**: Minimum 85% coverage
- **Frontend**: Minimum 80% coverage
- **New features**: Must include tests

### Writing Tests

#### Backend Tests
```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

#### Frontend Tests
```javascript
// src/components/__tests__/ChatComponent.test.js
import { render, screen } from '@testing-library/react';
import ChatComponent from '../ChatComponent';

test('renders chat input', () => {
  render(<ChatComponent />);
  const inputElement = screen.getByPlaceholderText(/type your message/i);
  expect(inputElement).toBeInTheDocument();
});
```

## 📝 Documentation

### API Documentation

- API endpoints should have proper docstrings
- Use OpenAPI/Swagger for API documentation
- Include examples in API docs

### Code Documentation

- Add docstrings to all functions and classes
- Use type hints where possible
- Document complex business logic

### README Updates

- Update README.md for new features
- Keep installation instructions current
- Update API documentation links

## 🐛 Bug Reports

### Creating Bug Reports

1. **Use the bug report template**
2. **Provide detailed information**
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Error messages/logs

3. **Include relevant code**
   - Minimal reproduction example
   - Stack traces
   - Configuration details

## 💡 Feature Requests

### Proposing Features

1. **Check existing issues** first
2. **Use the feature request template**
3. **Provide clear description**
   - Problem statement
   - Proposed solution
   - Use cases/benefits

## 🔍 Code Review Process

### Review Guidelines

1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code clean and maintainable?
3. **Testing**: Are tests adequate and passing?
4. **Documentation**: Is the code well documented?
5. **Performance**: Are there any performance concerns?

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly documented)
- [ ] Security considerations addressed

## 🏗️ Architecture Guidelines

### Backend Architecture

- Follow FastAPI best practices
- Use dependency injection
- Implement proper error handling
- Use async/await for I/O operations

### Frontend Architecture

- Follow React best practices
- Use functional components with hooks
- Implement proper state management
- Use TypeScript when possible

### Database Guidelines

- Use Alembic for migrations
- Follow proper indexing strategies
- Implement proper relationships
- Use transactions for data consistency

## 🔒 Security Considerations

- Never commit secrets or API keys
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication/authorization
- Follow OWASP security guidelines

## 📦 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tag created
- [ ] Release notes prepared

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain a positive and professional environment

### Getting Help

- **Documentation**: Check existing docs first
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (link in README)

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

## 📞 Contact

- **Maintainers**: Listed in README.md
- **Email**: maintainers@chronusai.com
- **Discord**: [Community Server](https://discord.gg/chronusai)

---

Thank you for contributing to ChronosAI! Your contributions help make this project better for everyone. 🚀

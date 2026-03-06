@echo off
REM ChronosAI - CI/CD Fix Verification Script (Windows)
REM Run this before pushing to verify all fixes work locally

echo.
echo 🚀 ChronosAI CI/CD Fix Verification
echo ====================================
echo.

cd backend

echo 📦 Step 1: Installing dependencies...
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
echo ✅ Dependencies installed
echo.

echo 🔍 Step 2: Running Ruff linter...
ruff check app tests
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Linting failed
    exit /b 1
)
echo ✅ Linting passed
echo.

echo 🔍 Step 3: Running Mypy type checker...
mypy app
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Type checking failed
    exit /b 1
)
echo ✅ Type checking passed
echo.

echo 🧪 Step 4: Running tests with coverage...
set PYTHONPATH=.
pytest -v --cov=app --cov-report=term-missing --cov-fail-under=50
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Tests failed or coverage too low
    exit /b 1
)
echo ✅ All tests passed with sufficient coverage
echo.

echo 🎉 SUCCESS! All checks passed!
echo.
echo Next steps:
echo 1. Review the changes:
echo    git status
echo    git diff
echo.
echo 2. Commit the fixes:
echo    git add .
echo    git commit -m "fix: CI/CD pipeline - update test schemas and coverage threshold"
echo.
echo 3. Push to trigger CI/CD:
echo    git push origin main
echo.
echo 4. Monitor the pipeline:
echo    https://github.com/johan-droid/ChronusAI/actions
echo.
echo ✅ Ready for deployment!

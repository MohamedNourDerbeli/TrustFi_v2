# Makefile for automating TrustFi Hardhat tasks (Windows/PowerShell friendly)

.PHONY: all clean compile kill-node kill-client start-node restart-node fund deploy start-client stop-all run help install install-contracts install-client

# Default target
all: help

# Display help information
help:
	@echo TrustFi Makefile Commands:
	@echo   make install        - Install dependencies for both contracts and client
	@echo   make install-contracts - Install contract dependencies
	@echo   make install-client - Install client dependencies
	@echo   make clean          - Clean Hardhat artifacts and cache
	@echo   make compile        - Compile contracts
	@echo   make kill-node      - Kill any running Hardhat node
	@echo   make kill-client    - Kill any running Vite dev server
	@echo   make start-node     - Start Hardhat node in background
	@echo   make restart-node   - Restart Hardhat node
	@echo   make fund           - Fund your account with 10 ETH
	@echo   make deploy         - Deploy ProfileNFT contract
	@echo   make start-client   - Start the Vite client application
	@echo   make stop-all       - Stop all running processes
	@echo   make run            - Full setup: restart node, fund, deploy, start client

# Install all dependencies
install: install-contracts install-client
	@echo All dependencies installed.

# Install contract dependencies
install-contracts:
	@echo Installing contract dependencies...
	cd contracts && npm install
	@echo Done.

# Install client dependencies
install-client:
	@echo Installing client dependencies...
	cd client && npm install
	@echo Done.

# Clean Hardhat artifacts and cache
clean:
	@echo Cleaning Hardhat artifacts...
	cd contracts && npx hardhat clean
	@echo Done.

# Compile contracts
compile:
	@echo Compiling contracts...
	cd contracts && npx hardhat compile
	@echo Done.

# Kill any running Hardhat node processes
kill-node:
	@echo Killing Hardhat node processes...
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$$_.CommandLine -like '*hardhat node*'} | Stop-Process -Force" 2>nul || echo No Hardhat node running.
	@powershell -Command "Start-Sleep -Seconds 2"

# Start Hardhat node in background
start-node:
	@echo Starting Hardhat node...
	@powershell -Command "Start-Process powershell -ArgumentList '-NoProfile', '-Command', 'cd contracts; npx hardhat node' -WindowStyle Hidden"
	@powershell -Command "Start-Sleep -Seconds 3"
	@echo Hardhat node started on http://127.0.0.1:8545

# Restart Hardhat node (kill + start)
restart-node: kill-node start-node

# Kill any running Vite dev server processes
kill-client:
	@echo Killing Vite dev server...
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$$_.CommandLine -like '*vite*'} | Stop-Process -Force" 2>nul || echo No Vite server running.
	@powershell -Command "Start-Sleep -Seconds 1"

# Fund your account with ETH
fund:
	@echo Funding account 0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5...
	cd contracts && npx hardhat run scripts/fund-account.js --network localhost
	@echo Done.

# Deploy ProfileNFT contract
deploy:
	@echo.
	@echo ========================================
	@echo Deploying ProfileNFT Contract
	@echo ========================================
	cd contracts && npx hardhat run scripts/deploy.ts --network localhost
	@echo.
	@echo ========================================
	@echo Deployment complete!
	@echo ========================================

# Start the Vite client application (kills existing first)
start-client: kill-client
	@echo Starting client application...
	@powershell -Command "Start-Process powershell -ArgumentList '-NoProfile', '-Command', 'cd client; npm run dev' -WindowStyle Hidden"
	@powershell -Command "Start-Sleep -Seconds 2"
	@echo Client started. Check http://localhost:5173

# Stop all running processes (node and client)
stop-all:
	@echo Stopping all processes...
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force" 2>nul || echo No node processes running.
	@echo All processes stopped.

# Full setup: restart node, fund account, deploy, start client
run: restart-node fund deploy start-client
	@echo.
	@echo ========================================
	@echo TrustFi Platform is ready!
	@echo ========================================
	@echo Hardhat Node: http://127.0.0.1:8545
	@echo Client App: http://localhost:5173
	@echo Your Account: 0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5
	@echo ========================================

# Makefile for automating TrustFi Hardhat tasks (Windows/PowerShell friendly)

.PHONY: all clean compile kill-node kill-client start-node restart-node fund-account deploy verify start-client stop-all run help

# Default target
all: help

# Display help information
help:
	@echo TrustFi Makefile Commands:
	@echo   make clean          - Clean Hardhat artifacts and cache
	@echo   make compile        - Compile contracts
	@echo   make kill-node      - Kill any running Hardhat node
	@echo   make kill-client    - Kill any running Vite dev server
	@echo   make start-node     - Start Hardhat node in background
	@echo   make restart-node   - Restart Hardhat node
	@echo   make fund-account   - Fund custom account with ETH
	@echo   make deploy         - Deploy contracts, authorize, update config and ABIs
	@echo   make verify         - Verify contract ownership
	@echo   make start-client   - Start the Vite client application
	@echo   make stop-all       - Stop all running processes
	@echo   make run            - Full setup: restart node, fund, deploy, start client

# Clean Hardhat artifacts and cache
clean:
	@echo Cleaning Hardhat artifacts...
	npx hardhat clean
	@echo Done.

# Compile contracts
compile:
	@echo Compiling contracts...
	npm run compile
	@echo Done.

# Kill any running Hardhat node processes
kill-node:
	@echo Killing Hardhat node processes...
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$$_.CommandLine -like '*hardhat node*'} | Stop-Process -Force" 2>nul || echo No Hardhat node running.
	@powershell -Command "Start-Sleep -Seconds 2"

# Start Hardhat node in background
start-node:
	@echo Starting Hardhat node...
	@powershell -Command "Start-Process powershell -ArgumentList '-NoProfile', '-Command', 'npx hardhat node' -WindowStyle Hidden"
	@powershell -Command "Start-Sleep -Seconds 3"
	@echo Hardhat node started on http://127.0.0.1:8545

# Restart Hardhat node (kill + start)
restart-node: kill-node start-node

# Kill any running Vite dev server processes
kill-client:
	@echo Killing Vite dev server...
	@powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$$_.CommandLine -like '*vite*'} | Stop-Process -Force" 2>nul || echo No Vite server running.
	@powershell -Command "Start-Sleep -Seconds 1"

# Fund the custom account with ETH from default Hardhat account
fund-account:
	@echo Funding custom account...
	npx hardhat run scripts/send.js --network localhost
	@powershell -Command "Start-Sleep -Seconds 1"

# Deploy contracts (does everything: deploy, authorize, update config, update ABIs)
deploy:
	@echo.
	@echo ========================================
	@echo Deploying TrustFi Contracts
	@echo ========================================
	npm run deploy
	@echo.
	@echo ========================================
	@echo Deployment complete!
	@echo ========================================

# Verify contract ownership
verify:
	@echo Verifying contract ownership...
	npm run verify:owner

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

# Full setup: restart node, fund, deploy, start client
run: restart-node fund-account deploy start-client
	@echo.
	@echo ========================================
	@echo TrustFi Platform is ready!
	@echo ========================================
	@echo Hardhat Node: http://127.0.0.1:8545
	@echo Client App: http://localhost:5173
	@echo Admin Account: 0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5
	@echo ========================================
	@echo.
	@echo Run 'make verify' to check contract ownership

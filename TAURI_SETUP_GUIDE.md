# Tauri Windows Setup Guide

Follow this quick guide to configure your Windows machine so you can compile and run your brand new native desktop app wrapper.

## Step 1: Install C++ Build Tools (Required by Rust compiler)
Tauri compiles into a native Windows executable, which requires the Microsoft C++ Build Tools.
1. Download the [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. Run the installer and select the **Desktop development with C++** workload.
3. Click **Install** (ensure the default sub-components like MSVC and Windows SDK are checked).

## Step 2: Install Rust
1. Download the Rust installer from [rustup.rs](https://rustup.rs/) (64-bit).
2. Run `rustup-init.exe`.
3. Type `1` and press **Enter** to proceed with the default installation.

## Step 3: Verify the Installation
Open a fresh terminal window (or restart VS Code) and run:
```bash
cargo --version
```
If it returns a version number, your machine is ready!

## Step 4: Run the App
Navigate to your project directory and run:
```powershell
# Bypass PowerShell script restrictions for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Launch the app in development mode
npm.cmd run tauri dev
```

## Step 5: Build a Production `.exe` Installer
When you are ready to compile a lightweight installer for distribution, run:
```powershell
npm.cmd run tauri build
```
Your compiled installer will be located in `src-tauri/target/release/bundle/msi/`.

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const SERVER_URL = 'http://localhost:3000/ALJ_Jonage_Escalade/';
const CHECK_INTERVAL = 15000; // 15 secondes
const PROJECT_PATH = __dirname.replace(/scripts$/, '');

let serverProcess = null;
let isRestarting = false;

// Fonction pour vérifier si le serveur est accessible
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(SERVER_URL, (res) => {
            resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Fonction pour arrêter le serveur
function stopServer() {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            // Windows
            spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' })
                .on('close', () => {
                    setTimeout(resolve, 2000);
                });
        } else {
            // Unix/Linux/macOS
            if (serverProcess) {
                serverProcess.kill('SIGTERM');
                serverProcess = null;
            }
            setTimeout(resolve, 2000);
        }
    });
}

// Fonction pour démarrer le serveur
function startServer() {
    return new Promise((resolve) => {
        console.log(`${new Date().toISOString()}: 🚀 Démarrage du serveur...`);
        
        const npmProcess = spawn('npm', ['run', 'dev'], {
            cwd: PROJECT_PATH,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });
        
        let resolved = false;
        
        npmProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            
            // Détecter quand Vite est prêt
            if (output.includes('ready in') && !resolved) {
                resolved = true;
                serverProcess = npmProcess;
                console.log(`${new Date().toISOString()}: ✅ Serveur démarré avec succès!`);
                setTimeout(resolve, 2000);
            }
        });
        
        npmProcess.stderr.on('data', (data) => {
            console.error('Erreur serveur:', data.toString());
        });
        
        npmProcess.on('close', (code) => {
            if (!resolved) {
                console.log(`${new Date().toISOString()}: ❌ Échec du démarrage (code: ${code})`);
                resolve();
            }
            serverProcess = null;
        });
        
        // Timeout de sécurité
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        }, 30000);
    });
}

// Fonction pour redémarrer le serveur
async function restartServer() {
    if (isRestarting) return;
    
    isRestarting = true;
    console.log(`${new Date().toISOString()}: 🔄 Redémarrage du serveur...`);
    
    await stopServer();
    await startServer();
    
    isRestarting = false;
}

// Fonction principale de surveillance
async function startMonitoring() {
    console.log(`${new Date().toISOString()}: 👁️  Démarrage de la surveillance automatique`);
    console.log(`Vérification toutes les ${CHECK_INTERVAL/1000} secondes`);
    console.log('Appuyez sur Ctrl+C pour arrêter\n');
    
    // Démarrage initial
    const isInitiallyRunning = await checkServer();
    if (!isInitiallyRunning) {
        await restartServer();
    } else {
        console.log(`${new Date().toISOString()}: ✅ Serveur déjà actif`);
    }
    
    // Surveillance continue
    setInterval(async () => {
        const isRunning = await checkServer();
        
        if (isRunning) {
            console.log(`${new Date().toISOString()}: ✅ Serveur OK`);
        } else {
            console.log(`${new Date().toISOString()}: ❌ Serveur non accessible - Redémarrage...`);
            await restartServer();
        }
    }, CHECK_INTERVAL);
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt de la surveillance...');
    await stopServer();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await stopServer();
    process.exit(0);
});

// Démarrage
startMonitoring().catch(console.error);
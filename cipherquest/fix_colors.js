const fs = require('fs');

function fixColorsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove LIGHT PROTOCOL from dashboard
    content = content.replace(/<button class="flex items-center gap-2 px-4 py-2 bg-surface-panel\/80 hover:bg-surface-panel transition-all border border-\[var\(--current-theme-color\)\]\/20 hover:border-\[var\(--current-theme-color\)\]\/50 shadow-\[0_0_10px_rgba\(0,0,0,0\.5\)\] rounded outline-none" \(click\)="gameData\.toggleThemeMode\(\)">[\s\S]*?<\/button>/, '');

    // Replace cyan specific classes with theme-aware styles where possible
    content = content.replace(/border-accent-cyan/g, "border-[color:var(--current-theme-color)]");
    content = content.replace(/text-accent-cyan/g, "text-[color:var(--current-theme-color)]");
    content = content.replace(/bg-accent-cyan/g, "bg-[color:var(--current-theme-color)]");
    content = content.replace(/ring-accent-cyan/g, "ring-[color:var(--current-theme-color)]");
    content = content.replace(/glow-text-cyan/g, "glow-text-theme");
    
    // Convert text-accent-green in completion checks
    content = content.replace(/text-accent-green/g, "text-[color:var(--current-theme-color)]");
    content = content.replace(/bg-accent-green/g, "bg-[color:var(--current-theme-color)]");
    content = content.replace(/border-accent-green/g, "border-[color:var(--current-theme-color)]");
    
    // Replace hardcoded RGB cyan with color-mix
    content = content.replace(/rgba\(0,229,255,([0-9.]+)\)/g, (m, alpha) => {
        const perc = parseFloat(alpha) * 100;
        return `color-mix(in srgb, var(--current-theme-color) ${perc}%, transparent)`;
    });
    // Replace rgb(0,255,136) (green)
    content = content.replace(/rgba\(0,255,136,([0-9.]+)\)/g, (m, alpha) => {
        const perc = parseFloat(alpha) * 100;
        return `color-mix(in srgb, var(--current-theme-color) ${perc}%, transparent)`;
    });

    fs.writeFileSync(filePath, content);
}

fixColorsInFile('./src/app/dashboard.ts');
fixColorsInFile('./src/app/lab.ts');

let gamedata = fs.readFileSync('./src/app/game-data.service.ts', 'utf8');
gamedata = gamedata.replace(/  readonly isLightMode = signal<boolean>\(localStorage\.getItem\('themeMode'\) === 'light'\);\n/, "");
gamedata = gamedata.replace(/      this\.applyTheme\(this\.selectedAvatar\(\), this\.isLightMode\(\)\);\n/, "      this.applyTheme(this.selectedAvatar());\n");
gamedata = gamedata.replace(/      this\.applyTheme\(avatar, this\.isLightMode\(\)\);\n/, "      this.applyTheme(avatar);\n");
gamedata = gamedata.replace(/  toggleThemeMode\(\) {[\s\S]*?}\n  \n/, "");
gamedata = gamedata.replace(/  private applyTheme\(avatar: AvatarVariant, isLight: boolean\) {[\s\S]*?\n  }/, "  private applyTheme(avatar: AvatarVariant) {\n      document.documentElement.style.setProperty('--current-theme-color', avatar.colorHex);\n      document.body.classList.remove('theme-light');\n  }");
fs.writeFileSync('./src/app/game-data.service.ts', gamedata);

let styles = fs.readFileSync('./src/styles.css', 'utf8');
styles = styles.replace(/\.glow-text-cyan/g, ".glow-text-theme");
styles = styles.replace(/rgba\(0, 229, 255, 0\.4\)/g, "color-mix(in srgb, var(--current-theme-color) 40%, transparent)");
fs.writeFileSync('./src/styles.css', styles);

console.log("Colors updated.");

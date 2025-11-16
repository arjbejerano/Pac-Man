import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  direction: number;
  color: string;
  speed: number;
  mode: 'chase' | 'scatter' | 'frightened' | 'eaten';
  homeX: number;
  homeY: number;
  inHouse: boolean;
  exitTimer: number;
  name: string;
}

interface GameState {
  pacman: Position;
  ghosts: Ghost[];
  dots: boolean[][];
  powerPellets: Position[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  gameWon: boolean;
  direction: number;
  nextDirection: number;
  powerPelletTimer: number;
  gameStarted: boolean;
  animationFrame: number;
  mouthOpen: boolean;
  levelComplete: boolean;
}

const CELL_SIZE = 24;
const MAZE_WIDTH = 27;
const MAZE_HEIGHT = 31;

// Classic Pac-Man maze layout (1 = wall, 0 = path, 2 = dot, 3 = power pellet, 4 = ghost house, 5 = teleport)
const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,0,0,0,1,1,0,1,1,2,1,1,1,1,1,1],
  [5,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,5],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [5,0,0,0,0,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,2,0,0,0,0,0,5],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,2,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const GHOST_COLORS = [
  'red',      // Red
  'orange',   // Orange  
  'green',    // Green
  'blue',     // Blue
  'indigo',   // Indigo
  'violet'    // Violet
];

const WALL_COLORS = [
  'hsl(var(--wall-blue))',
  'hsl(var(--wall-purple))',
  'hsl(var(--wall-pink))',
  'hsl(var(--wall-red))',
  'hsl(var(--wall-orange))',
  'hsl(var(--wall-yellow))',
  'hsl(var(--wall-green))',
  'hsl(var(--wall-cyan))'
];

const DIRECTIONS = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

const DIRECTION_VECTORS = [
  { x: 0, y: -1 }, // UP
  { x: 1, y: 0 },  // RIGHT
  { x: 0, y: 1 },  // DOWN
  { x: -1, y: 0 }  // LEFT
];

const POWER_PELLET_DURATION = 300; // frames
const GHOST_HOUSE_X = 13;
const GHOST_HOUSE_Y = 11;

export default function PacManGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const dots = MAZE_LAYOUT.map(row => row.map(cell => cell === 2));
    const powerPellets: Position[] = [];
    
    // Find power pellets
    MAZE_LAYOUT.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 3) {
          powerPellets.push({ x, y });
        }
      });
    });

    return {
      pacman: { x: 13, y: 23 },
      ghosts: [
        { 
          x: GHOST_HOUSE_X, y: GHOST_HOUSE_Y, direction: 0, color: GHOST_COLORS[0], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 0, name: 'Red'
        },
        { 
          x: GHOST_HOUSE_X - 1, y: GHOST_HOUSE_Y, direction: 1, color: GHOST_COLORS[1], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X - 1, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 60, name: 'Orange'
        },
        { 
          x: GHOST_HOUSE_X + 1, y: GHOST_HOUSE_Y, direction: 2, color: GHOST_COLORS[2], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X + 1, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 120, name: 'Green'
        },
        { 
          x: GHOST_HOUSE_X, y: GHOST_HOUSE_Y + 1, direction: 3, color: GHOST_COLORS[3], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X, homeY: GHOST_HOUSE_Y + 1, 
          inHouse: true, exitTimer: 180, name: 'Blue'
        },
        { 
          x: GHOST_HOUSE_X - 2, y: GHOST_HOUSE_Y, direction: 0, color: GHOST_COLORS[4], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X - 2, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 240, name: 'Indigo'
        },
        { 
          x: GHOST_HOUSE_X + 2, y: GHOST_HOUSE_Y, direction: 2, color: GHOST_COLORS[5], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X + 2, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 300, name: 'Violet'
        }
      ],
      dots,
      powerPellets,
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      gameWon: false,
      direction: DIRECTIONS.LEFT,
      nextDirection: DIRECTIONS.LEFT,
      powerPelletTimer: 0,
      gameStarted: false,
      animationFrame: 0,
      mouthOpen: true,
      levelComplete: false
    };
  });

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, []);

  const initializeGame = useCallback(() => {
    const dots = MAZE_LAYOUT.map(row => row.map(cell => cell === 2));
    const powerPellets: Position[] = [];
    
    MAZE_LAYOUT.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 3) {
          powerPellets.push({ x, y });
        }
      });
    });

    setGameState({
      pacman: { x: 13, y: 23 },
      ghosts: [
        { 
          x: GHOST_HOUSE_X, y: GHOST_HOUSE_Y, direction: 0, color: GHOST_COLORS[0], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 0, name: 'Red'
        },
        { 
          x: GHOST_HOUSE_X - 1, y: GHOST_HOUSE_Y, direction: 1, color: GHOST_COLORS[1], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X - 1, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 60, name: 'Orange'
        },
        { 
          x: GHOST_HOUSE_X + 1, y: GHOST_HOUSE_Y, direction: 2, color: GHOST_COLORS[2], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X + 1, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 120, name: 'Green'
        },
        { 
          x: GHOST_HOUSE_X, y: GHOST_HOUSE_Y + 1, direction: 3, color: GHOST_COLORS[3], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X, homeY: GHOST_HOUSE_Y + 1, 
          inHouse: true, exitTimer: 180, name: 'Blue'
        },
        { 
          x: GHOST_HOUSE_X - 2, y: GHOST_HOUSE_Y, direction: 0, color: GHOST_COLORS[4], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X - 2, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 240, name: 'Indigo'
        },
        { 
          x: GHOST_HOUSE_X + 2, y: GHOST_HOUSE_Y, direction: 2, color: GHOST_COLORS[5], 
          speed: 0.5, mode: 'scatter', homeX: GHOST_HOUSE_X + 2, homeY: GHOST_HOUSE_Y, 
          inHouse: true, exitTimer: 300, name: 'Violet'
        }
      ],
      dots,
      powerPellets,
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      gameWon: false,
      direction: DIRECTIONS.LEFT,
      nextDirection: DIRECTIONS.LEFT,
      powerPelletTimer: 0,
      gameStarted: true,
      animationFrame: 0,
      mouthOpen: true,
      levelComplete: false
    });
  }, []);

  const isValidMove = (x: number, y: number): boolean => {
    if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) {
      return false;
    }
    const cell = MAZE_LAYOUT[y][x];
    return cell !== 1; // Not a wall
  };

  const handleTeleport = (x: number, y: number): Position => {
    // Teleport tunnels on sides
    if (x < 0 && y === 9) return { x: MAZE_WIDTH - 1, y };
    if (x >= MAZE_WIDTH && y === 9) return { x: 0, y };
    if (x < 0 && y === 17) return { x: MAZE_WIDTH - 1, y };
    if (x >= MAZE_WIDTH && y === 17) return { x: 0, y };
    return { x, y };
  };

  const getDistance = (pos1: Position, pos2: Position): number => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };

  const getGhostTarget = (ghost: Ghost, pacman: Position): Position => {
    switch (ghost.mode) {
      case 'chase':
        // Each ghost has different chase behavior
        switch (ghost.name) {
          case 'Red': // Red - directly targets Pac-Man
            return pacman;
          case 'Orange': // Orange - targets 4 spaces ahead of Pac-Man
            const orangeVector = DIRECTION_VECTORS[gameState.direction];
            return { 
              x: pacman.x + orangeVector.x * 4, 
              y: pacman.y + orangeVector.y * 4 
            };
          case 'Green': // Green - complex targeting based on Red and Pac-Man
            const redGhost = gameState.ghosts[0];
            const greenVector = DIRECTION_VECTORS[gameState.direction];
            const targetX = pacman.x + greenVector.x * 2;
            const targetY = pacman.y + greenVector.y * 2;
            return {
              x: targetX + (targetX - redGhost.x),
              y: targetY + (targetY - redGhost.y)
            };
          case 'Blue': // Blue - targets Pac-Man if far, otherwise scatters
            const distance = getDistance(ghost, pacman);
            if (distance > 8) {
              return pacman;
            } else {
              return { x: 0, y: MAZE_HEIGHT - 1 }; // Bottom left corner
            }
          case 'Indigo': // Indigo - patrols horizontally
            return { x: pacman.x, y: ghost.y };
          case 'Violet': // Violet - patrols vertically
            return { x: ghost.x, y: pacman.y };
          default:
            return pacman;
        }
      case 'scatter':
        // Each ghost goes to its corner
        switch (ghost.name) {
          case 'Red': return { x: MAZE_WIDTH - 1, y: 0 }; // Top right
          case 'Orange': return { x: 0, y: 0 }; // Top left
          case 'Green': return { x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 }; // Bottom right
          case 'Blue': return { x: 0, y: MAZE_HEIGHT - 1 }; // Bottom left
          case 'Indigo': return { x: MAZE_WIDTH / 2, y: 0 }; // Top center
          case 'Violet': return { x: MAZE_WIDTH / 2, y: MAZE_HEIGHT - 1 }; // Bottom center
          default: return { x: 0, y: 0 };
        }
      case 'frightened':
        // Random movement
        return { 
          x: Math.floor(Math.random() * MAZE_WIDTH), 
          y: Math.floor(Math.random() * MAZE_HEIGHT) 
        };
      case 'eaten':
        // Return to ghost house
        return { x: GHOST_HOUSE_X, y: GHOST_HOUSE_Y };
      default:
        return pacman;
    }
  };

  const getBestDirection = (ghost: Ghost, target: Position): number => {
    let bestDirection = ghost.direction;
    let shortestDistance = Infinity;
    
    // Try all directions except reverse (unless necessary)
    for (let dir = 0; dir < 4; dir++) {
      if (dir === (ghost.direction + 2) % 4 && ghost.mode !== 'frightened') continue; // Don't reverse unless frightened
      
      const vector = DIRECTION_VECTORS[dir];
      const newX = ghost.x + vector.x;
      const newY = ghost.y + vector.y;
      
      if (isValidMove(newX, newY)) {
        const distance = getDistance({ x: newX, y: newY }, target);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestDirection = dir;
        }
      }
    }
    
    return bestDirection;
  };

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with black background
    ctx.fillStyle = 'hsl(var(--game-bg))';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze walls with rainbow colors
    MAZE_LAYOUT.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const colorIndex = (x + y) % WALL_COLORS.length;
          ctx.fillStyle = WALL_COLORS[colorIndex];
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          
          // Add glow effect
          ctx.shadowColor = WALL_COLORS[colorIndex];
          ctx.shadowBlur = 8;
          ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          ctx.shadowBlur = 0;
        } else if (cell === 4) {
          // Ghost house
          ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      });
    });

    // Draw dots
    gameState.dots.forEach((row, y) => {
      row.forEach((hasDot, x) => {
        if (hasDot) {
          ctx.fillStyle = 'hsl(var(--dot-color))';
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    });

    // Draw power pellets with pulsing effect
    gameState.powerPellets.forEach(pellet => {
      const pulseSize = 6 + Math.sin(gameState.animationFrame * 0.2) * 2;
      ctx.fillStyle = 'hsl(var(--power-pellet))';
      ctx.shadowColor = 'hsl(var(--power-pellet))';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(
        pellet.x * CELL_SIZE + CELL_SIZE / 2,
        pellet.y * CELL_SIZE + CELL_SIZE / 2,
        pulseSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Pac-Man with mouth animation
    const pacX = gameState.pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const pacY = gameState.pacman.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.fillStyle = 'yellow';
    ctx.shadowColor = 'yellow';
    ctx.shadowBlur = 20;
    
    ctx.beginPath();
    if (gameState.mouthOpen) {
      const mouthAngle = Math.PI / 3;
      const startAngle = gameState.direction * Math.PI / 2 - mouthAngle / 2;
      const endAngle = gameState.direction * Math.PI / 2 + mouthAngle / 2;
      
      ctx.arc(pacX, pacY, CELL_SIZE / 2 - 2, endAngle, startAngle);
      ctx.lineTo(pacX, pacY);
    } else {
      ctx.arc(pacX, pacY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw ghosts
    gameState.ghosts.forEach(ghost => {
      const ghostX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
      const ghostY = ghost.y * CELL_SIZE + CELL_SIZE / 2;
      
      // Ghost color changes when frightened
      if (ghost.mode === 'frightened') {
        ctx.fillStyle = gameState.powerPelletTimer > 60 ? 'blue' : 
                        (gameState.animationFrame % 20 < 10 ? 'blue' : 'white');
      } else if (ghost.mode === 'eaten') {
        ctx.fillStyle = 'gray';
      } else {
        ctx.fillStyle = ghost.color;
      }
      
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(ghostX, ghostY - 2, CELL_SIZE / 2 - 2, Math.PI, 0);
      ctx.lineTo(ghostX + CELL_SIZE / 2 - 2, ghostY + CELL_SIZE / 2 - 2);
      
      // Ghost bottom wavy part
      for (let i = 0; i < 3; i++) {
        const waveX = ghostX + CELL_SIZE / 2 - 2 - (i * (CELL_SIZE - 4) / 3);
        const waveY = ghostY + CELL_SIZE / 2 - 2 - (i % 2 === 0 ? 4 : 0);
        ctx.lineTo(waveX, waveY);
      }
      
      ctx.lineTo(ghostX - CELL_SIZE / 2 + 2, ghostY + CELL_SIZE / 2 - 2);
      ctx.fill();
      
      // Ghost eyes
      if (ghost.mode !== 'eaten') {
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(ghostX - 4, ghostY - 4, 2, 0, Math.PI * 2);
        ctx.arc(ghostX + 4, ghostY - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(ghostX - 4, ghostY - 4, 1, 0, Math.PI * 2);
        ctx.arc(ghostX + 4, ghostY - 4, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw power pellet timer
    if (gameState.powerPelletTimer > 0) {
      ctx.fillStyle = 'yellow';
      ctx.font = '16px Arial';
      ctx.fillText(`Power: ${Math.ceil(gameState.powerPelletTimer / 60)}s`, 10, canvas.height - 10);
    }
  }, [gameState]);

  const updateGame = useCallback(() => {
    if (gameState.gameOver || gameState.levelComplete) return;

    setGameState(prevState => {
      const newState = { ...prevState };
      newState.animationFrame++;

      // Mouth animation
      if (newState.animationFrame % 10 === 0) {
        newState.mouthOpen = !newState.mouthOpen;
      }

      // Power pellet timer
      if (newState.powerPelletTimer > 0) {
        newState.powerPelletTimer--;
        if (newState.powerPelletTimer === 0) {
          // Return ghosts to normal mode
          newState.ghosts.forEach(ghost => {
            if (ghost.mode === 'frightened') {
              ghost.mode = 'chase';
            }
          });
        }
      }

      // Try to change direction if possible
      const nextVector = DIRECTION_VECTORS[newState.nextDirection];
      const nextX = newState.pacman.x + nextVector.x;
      const nextY = newState.pacman.y + nextVector.y;
      
      if (isValidMove(nextX, nextY)) {
        newState.direction = newState.nextDirection;
      }

      // Move Pac-Man
      const dirVector = DIRECTION_VECTORS[newState.direction];
      let newPacX = newState.pacman.x + dirVector.x;
      let newPacY = newState.pacman.y + dirVector.y;

      // Handle teleport
      const teleportPos = handleTeleport(newPacX, newPacY);
      newPacX = teleportPos.x;
      newPacY = teleportPos.y;

      if (isValidMove(newPacX, newPacY)) {
        newState.pacman.x = newPacX;
        newState.pacman.y = newPacY;

        // Collect dots
        if (newState.dots[newPacY] && newState.dots[newPacY][newPacX]) {
          newState.dots[newPacY][newPacX] = false;
          newState.score += 10;
          playSound(800, 0.1);
        }

        // Collect power pellets
        const pelletIndex = newState.powerPellets.findIndex(
          pellet => pellet.x === newPacX && pellet.y === newPacY
        );
        if (pelletIndex !== -1) {
          newState.powerPellets.splice(pelletIndex, 1);
          newState.score += 50;
          newState.powerPelletTimer = POWER_PELLET_DURATION;
          
          // Make all ghosts frightened
          newState.ghosts.forEach(ghost => {
            if (ghost.mode !== 'eaten') {
              ghost.mode = 'frightened';
              ghost.direction = (ghost.direction + 2) % 4; // Reverse direction
            }
          });
          
          playSound(200, 0.5, 'sine');
        }
      }

      // Move ghosts
      newState.ghosts.forEach(ghost => {
        // Handle exit timer for ghosts in house
        if (ghost.inHouse) {
          if (ghost.exitTimer > 0) {
            ghost.exitTimer--;
          } else {
            ghost.inHouse = false;
            ghost.y = 9; // Move to tunnel
          }
          return;
        }

        // Ghost AI
        if (newState.animationFrame % 4 === 0) { // Much slower ghost movement
          const target = getGhostTarget(ghost, newState.pacman);
          
          if (ghost.mode === 'frightened') {
            // Random movement when frightened
            if (Math.random() < 0.3) {
              ghost.direction = Math.floor(Math.random() * 4);
            }
          } else {
            ghost.direction = getBestDirection(ghost, target);
          }

          const ghostVector = DIRECTION_VECTORS[ghost.direction];
          let newGhostX = ghost.x + ghostVector.x;
          let newGhostY = ghost.y + ghostVector.y;

          // Handle teleport for ghosts
          const ghostTeleportPos = handleTeleport(newGhostX, newGhostY);
          newGhostX = ghostTeleportPos.x;
          newGhostY = ghostTeleportPos.y;

          if (isValidMove(newGhostX, newGhostY) || MAZE_LAYOUT[newGhostY]?.[newGhostX] === 4) {
            ghost.x = newGhostX;
            ghost.y = newGhostY;

            // Check if ghost returned to house when eaten
            if (ghost.mode === 'eaten' && ghost.x === GHOST_HOUSE_X && ghost.y === GHOST_HOUSE_Y) {
              ghost.mode = 'scatter';
              ghost.inHouse = true;
              ghost.exitTimer = 60;
            }
          } else {
            // Change direction if hit wall
            ghost.direction = Math.floor(Math.random() * 4);
          }
        }
      });

      // Check collision with ghosts
      newState.ghosts.forEach(ghost => {
        if (Math.abs(ghost.x - newState.pacman.x) < 0.8 && 
            Math.abs(ghost.y - newState.pacman.y) < 0.8 && 
            !ghost.inHouse) {
          
          if (ghost.mode === 'frightened') {
            // Eat ghost
            ghost.mode = 'eaten';
            newState.score += 200;
            playSound(400, 0.3);
          } else if (ghost.mode !== 'eaten') {
            // Pac-Man dies
            newState.lives--;
            playSound(150, 1, 'sawtooth');
            
            if (newState.lives <= 0) {
              newState.gameOver = true;
            } else {
              // Reset positions
              newState.pacman = { x: 13, y: 23 };
              newState.ghosts.forEach((g, index) => {
                g.x = g.homeX;
                g.y = g.homeY;
                g.inHouse = true;
                g.exitTimer = index * 30;
                g.mode = 'scatter';
              });
              newState.powerPelletTimer = 0;
            }
          }
        }
      });

      // Check if level completed
      const totalDots = newState.dots.flat().filter(Boolean).length;
      if (totalDots === 0 && newState.powerPellets.length === 0) {
        newState.levelComplete = true;
        playSound(600, 2, 'sine');
      }

      // Switch ghost modes periodically
      if (newState.animationFrame % 600 === 0 && newState.powerPelletTimer === 0) {
        newState.ghosts.forEach(ghost => {
          if (ghost.mode === 'chase') {
            ghost.mode = 'scatter';
          } else if (ghost.mode === 'scatter') {
            ghost.mode = 'chase';
          }
        });
      }

      return newState;
    });
  }, [gameState.gameOver, gameState.levelComplete, playSound]);

  const nextLevel = useCallback(() => {
    const dots = MAZE_LAYOUT.map(row => row.map(cell => cell === 2));
    const powerPellets: Position[] = [];
    
    MAZE_LAYOUT.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 3) {
          powerPellets.push({ x, y });
        }
      });
    });

    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      dots,
      powerPellets,
      pacman: { x: 13, y: 23 },
      ghosts: prev.ghosts.map((ghost, index) => ({
        ...ghost,
        x: ghost.homeX,
        y: ghost.homeY,
        inHouse: true,
        exitTimer: index * 60,
        mode: 'scatter' as const,
        speed: Math.min(ghost.speed + 0.1, 2)
      })),
      powerPelletTimer: 0,
      levelComplete: false,
      animationFrame: 0
    }));
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState.gameOver || gameState.levelComplete) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        setGameState(prev => ({ ...prev, nextDirection: DIRECTIONS.UP }));
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        setGameState(prev => ({ ...prev, nextDirection: DIRECTIONS.DOWN }));
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        setGameState(prev => ({ ...prev, nextDirection: DIRECTIONS.LEFT }));
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        setGameState(prev => ({ ...prev, nextDirection: DIRECTIONS.RIGHT }));
        break;
    }
  }, [gameState.gameOver, gameState.levelComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!gameState.gameStarted) return;

    const gameLoop = () => {
      updateGame();
      drawGame();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [updateGame, drawGame, gameState.gameStarted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      <div className="mb-4 text-center">
        <h1 className="text-5xl font-bold mb-4" style={{ color: 'yellow' }}>
          PAC-MAN
        </h1>
        <div className="flex gap-8 text-xl font-semibold mb-2">
          <div style={{ color: 'yellow' }}>
            Score: {gameState.score.toLocaleString()}
          </div>
          <div style={{ color: 'red' }}>
            Lives: {gameState.lives}
          </div>
          <div style={{ color: 'cyan' }}>
            Level: {gameState.level}
          </div>
        </div>
        
        {/* Lives display */}
        <div className="flex justify-center gap-2 mb-2">
          {Array.from({ length: gameState.lives }, (_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: 'yellow' }}
            />
          ))}
        </div>
      </div>

      {!gameState.gameStarted ? (
        <div className="text-center">
          <div className="text-2xl mb-4" style={{ color: 'pink' }}>
            Press Start to Begin!
          </div>
          <Button 
            onClick={initializeGame}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-8 py-4"
          >
            START GAME
          </Button>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={MAZE_WIDTH * CELL_SIZE}
            height={MAZE_HEIGHT * CELL_SIZE}
            className="border-4 border-yellow-400 rounded-lg shadow-2xl"
            style={{ 
              boxShadow: '0 0 40px yellow',
              backgroundColor: 'black'
            }}
          />

          <div className="mt-4 text-center">
            <div className="text-lg mb-2" style={{ color: 'pink' }}>
              Use Arrow Keys or WASD to move Pac-Man
            </div>
            
            {gameState.levelComplete && (
              <div className="mb-4">
                <div className="text-3xl font-bold mb-4" style={{ color: 'green' }}>
                  LEVEL {gameState.level} COMPLETE!
                </div>
                <Button 
                  onClick={nextLevel}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold text-xl px-6 py-3"
                >
                  Next Level
                </Button>
              </div>
            )}
            
            {gameState.gameOver && (
              <div className="mb-4">
                <div className="text-3xl font-bold mb-4" style={{ color: 'red' }}>
                  GAME OVER
                </div>
                <div className="text-xl mb-4" style={{ color: 'yellow' }}>
                  Final Score: {gameState.score.toLocaleString()}
                </div>
                <Button 
                  onClick={initializeGame}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-6 py-3"
                >
                  Play Again
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="mt-4 text-center text-sm" style={{ color: 'cyan' }}>
        <div>🔴 Red chases directly • 🟠 Orange ambushes ahead • 🟢 Green uses complex strategy</div>
        <div>🔵 Blue is unpredictable • 🟣 Indigo patrols horizontally • 🟪 Violet patrols vertically</div>
        <div>Collect all dots and power pellets to win!</div>
      </div>
    </div>
  );
}
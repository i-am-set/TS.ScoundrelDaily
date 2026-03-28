import "./style.css";
import { GameApp } from "./core/GameApp";

async function bootstrap() {
  const game = new GameApp();
  await game.init();
}

bootstrap().catch(console.error);

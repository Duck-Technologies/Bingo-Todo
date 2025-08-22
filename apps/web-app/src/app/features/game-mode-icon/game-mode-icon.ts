import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-game-mode-icon',
  imports: [MatTooltip],
  templateUrl: './game-mode-icon.html',
  styleUrl: './game-mode-icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameModeIcon {
  public readonly gameMode = input.required<'todo' | 'traditional'>();
  protected readonly todoTooltip = "TO-DO game mode with the goal of marking all tasks.";
  protected readonly traditionalTooltip = "Bingo game mode with the goal of reaching a vertical, horizontal or diagonal pattern from marked tasks.";
}

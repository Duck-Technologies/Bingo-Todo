import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BoardCell } from '../board/board';
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-board-list-view',
  imports: [MatCardModule, MatDivider],
  templateUrl: './board-list-view.html',
  styleUrl: './board-list-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardListView {
  public readonly Math = Math;
  public readonly cards = model.required<BoardCell[]>();
  public checkCard(card: BoardCell) {
    if (!!card.CheckedDateUTC) return;

    card.Selected = !card.Selected;
    this.cards.set([...this.cards()]);
  }
  public readonly boardSize = computed(
    () => ({ 9: 3, 16: 4, 25: 5 } as const)[this.cards().length] ?? 3
  );
}

import { DiffSelection } from '../../models/diff'
import { ISelectionStrategy } from './selection-strategy'
import { range } from '../../lib/range'

export class DragDropSelectionStrategy implements ISelectionStrategy {
  private readonly _start: number
  private readonly _desiredSelection: boolean
  private readonly _snapshot: DiffSelection

  private _current: number

  public constructor(start: number, desiredSelection: boolean, snapshot: DiffSelection) {
    this._start = start
    this._current = start
    this._desiredSelection = desiredSelection
    this._snapshot = snapshot
  }

  /**
   * Return the lower bounds of the selection range
   */
  public get lowerIndex(): number {
    if (this._start <= this._current) {
      return this._start
    }

    return this._current
  }

  /**
   * Return the upper bounds of the selection range
   */
  public get upperIndex(): number {
    if (this._start <= this._current) {
      return this._current
    }

    return this._start
  }

  /**
   * Return the index associated with the start of this gesture
   */
  public get initialIndex(): number {
      return this._start
  }

  /**
   * Return the index associated with the start of this gesture
   */
  public get desiredSelection(): boolean {
    return this._desiredSelection
  }

  /**
   * update the row the user is currently interacting with
   */
  public update(current: number) {
    this._current = current
  }

  public apply(onIncludeChanged?: (diffSelection: DiffSelection) => void) {
    if (onIncludeChanged) {
      const length = (this.upperIndex - this.lowerIndex) + 1

      const newSelection = this._snapshot.withRangeSelection(
        this.lowerIndex,
        length,
        this.desiredSelection)

        onIncludeChanged(newSelection)
    }
  }

  public paint(elements: Map<number, HTMLSpanElement>) {

    // as user can go back and forth when doing drag-and-drop, we should
    // update rows outside the current selected range
    let start = this.lowerIndex - 1
    if (start < 1) {
      start = 1 // 0 is always the diff context
    }

    const maximum = elements.size
    let end = this.upperIndex + 1
    if (end >= maximum) {
      end = maximum - 1 // ensure that we stay within the diff bounds
    }

    range(start, end).forEach(row => {
      const element = elements.get(row)
      if (!element) {
        console.error('expected gutter element not found')
        return
      }

      const selected = this.getIsSelected(row)
      const childSpan = element.children[0] as HTMLSpanElement
      if (!childSpan) {
        console.error('expected DOM element for diff gutter not found')
        return
      }

      if (selected) {
        childSpan.classList.add('diff-line-selected')
      } else {
        childSpan.classList.remove('diff-line-selected')
      }
    })
  }

  /**
   * compute the selected state for a given row, based on the current gesture
   * values inside the range pick up the desired value, and values
   * outside the range revert to the initially selected state
   */
  public getIsSelected(index: number): boolean {
    // if we're in the diff range, use the stored value
    if (index >= this.lowerIndex && index <= this.upperIndex) {
      return this._desiredSelection
    }

    return this._snapshot.isSelected(index)
  }
}

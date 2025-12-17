// edit.component.ts template
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
  effect,
  inject
} from "@angular/core";
import { ENTITY_CONSTRUCTOR, FormBaseComponent, RequestType } from "@cartesianui/common";
import { _Library_Sandbox } from "../../../_library_.sandbox";
import { FORM_IMPORTS } from "../../../_library_.imports";
import { _Entity_ } from "../../../models";

@Component({
  selector: "_section_-edit-_entity_-form",
  templateUrl: "./edit.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...FORM_IMPORTS
  ],
  providers: [
    {
      provide: ENTITY_CONSTRUCTOR,
      useValue: _Entity_
    }
  ],
  standalone: true
})
export class _Entity_EditComponent
  extends FormBaseComponent<_Entity_>
  implements OnDestroy
{
  protected sb = inject(_Library_Sandbox);

  readonly _entityName_: Signal<_Entity_> = this.sb._entityName_.selected;

  // handle select state effect
  private readonly selectEffect = effect(() => {
    if (!this._entityName_()) return;
    this.formGroup = this.getFormFromEntity(this._entityName_());
  });

  // handle busy state effect
  private readonly busyEffect = effect(() => {
    this.handleFormBusyState(this.sb._entityName_.updateState());
  });

  // handle complete state effect
  private readonly completeEffect = effect(() => {
    if (!this.sb._entityName_.updateCompleted()) return;

    this.notify.success("Successfully Updated", "Success");
    this.sb._entityName_.clearRequestState(RequestType.Update);
  });

  constructor() {
    super(_Entity_);
    this.initForm();
  }

  onSave(): void {
    if(!this.formGroup.valid) return;
    const updatedEntity = this.getEntityFromForm();
    this.sb._entityName_.update(this._entityName_()?.id, updatedEntity);
  }
}

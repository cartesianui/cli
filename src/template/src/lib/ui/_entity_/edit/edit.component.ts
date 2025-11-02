// edit.component.ts template
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
  effect,
  inject
} from "@angular/core";
import { FormBaseComponent, RequestType } from "@cartesianui/common";
import { _Library_Sandbox } from "../../../_library_.sandbox";
import { FORM_IMPORTS } from "../../../bookeeper.imports";
import { _Entity_ } from "../../../models";

@Component({
  selector: "admin-edit-_entity_-form",
  templateUrl: "./edit.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
      ...FORM_IMPORTS
    ],
    standalone: true
})
export class _Entity_EditComponent
  extends FormBaseComponent<_Entity_>
  implements OnDestroy
{
  protected sb = inject(_Library_Sandbox);

  readonly _entityName_: Signal<_Entity_> = this.sb._entityName_.selected;

  readonly selectedEffect = effect(() => {
      if(this._entityName_()) {
        this.formGroup = this.getFormFromEntity(this._entityName_());
      }
  });

  readonly bussyEffect = effect(() => {
    this.handleFormBusyState(this.sb._entityName_.updateState());
    if (this.sb._entityName_.updateCompleted()) {
      this.notify.success("Successfully Updated", "Success");
      this.sb._entityName_.clearRequestState(RequestType.Update);
    }
  });

  constructor() {
    super(_Entity_);
    this.initForm();
  }

  onSave(): void {
    if (this.formGroup.valid) {
      const updatedEntity = this.getEntityFromForm();
      this.sb._entityName_.update(this._entityName_()?.id, updatedEntity);
    }
  }
}

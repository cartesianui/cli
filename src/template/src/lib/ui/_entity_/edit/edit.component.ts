// edit.component.ts template
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormBaseComponent, RequestType } from "@cartesianui/common";
import { _Library_Sandbox } from "../../../_library_.sandbox";
import { _Entity_, _Entity_Search } from "../../../models";

@Component({
  selector: "bo-edit-_entity_-form",
  templateUrl: "./edit.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class _Entity_EditComponent
  extends FormBaseComponent<_Entity_>
  implements OnInit, OnDestroy
{
  _entityName_: _Entity_;
  constructor(injector: Injector, protected sb: _Library_Sandbox) {
    super(injector, _Entity_);
    this.initForm();
  }

  ngOnInit(): void {
    this.addSubscriptions();
  }

  addSubscriptions() {
    this.subscriptions.push(
      this.sb._entityName_.selected$.subscribe((_entityName_: _Entity_) => {
        this._entityName_ = _entityName_;
        this.formGroup = this.getFormFromEntity(_entityName_);
      })
    );

    this.subscriptions.push(
      this.sb._entityName_.updateState$.subscribe((state) => {
        this.handleFormBusyState(state);
        if (state.completed) {
          this.notify.success("Successfully Updated", "Success");
          this.sb._entityName_.clearRequestState(RequestType.Update);
        }
      })
    );
  }

  onSave(): void {
    if (this.formGroup.valid) {
      const updatedEntity = this.getEntityFromForm();
      this.sb._entityName_.update(this._entityName_?.id, updatedEntity);
    }
  }
}

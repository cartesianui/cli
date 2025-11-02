import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ChangeDetectorRef, effect, inject } from '@angular/core';
import { FormBaseComponent, RequestType } from '@cartesianui/common';
import { _Library_Sandbox } from '../../../_library_.sandbox';
import { FORM_IMPORTS } from '../../../_library_.imports';
import { _Entity_ } from '../../../models';

@Component({
    selector: 'admin-create-_entity_-form',
    templateUrl: './create.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...FORM_IMPORTS
    ],
    standalone: true
})
export class _Entity_CreateComponent extends FormBaseComponent<_Entity_> implements OnDestroy {
  protected sb = inject(_Library_Sandbox);
  protected cdr = inject(ChangeDetectorRef)

  readonly bussyEffect = effect(() => {
    this.handleFormBusyState(this.sb._entityName_.createState());
    if (this.sb._entityName_.createCompleted()) {
      this.created.emit(true);
      this.notify.success("Successfully Created", "Success");
      this.sb._entityName_.clearRequestState(RequestType.Create);
    }
  });

  constructor() {
    super(_Entity_);
    this.initForm();
  }

  onSave(): void {
    if (this.formGroup.valid) {
      const entity = this.getEntityFromForm();
      this.sb._entityName_.create(entity);
    }
  }
}

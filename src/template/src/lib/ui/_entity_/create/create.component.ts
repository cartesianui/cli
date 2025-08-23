import { Injector, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBaseComponent, RequestType } from '@cartesianui/common';
import { _Library_Sandbox } from '../../../_library_.sandbox';
import { _Entity_ } from '../../../models';

@Component({
  selector: 'bo-create-_entity_-form',
  templateUrl: './create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class _Entity_CreateComponent extends FormBaseComponent<_Entity_> implements OnInit, OnDestroy {
  constructor(
    injector: Injector,
    protected sb: _Library_Sandbox
  ) {
    super(injector, _Entity_);
    this.initForm();
  }

  ngOnInit(): void {
    this.addSubscriptions();
  }

  onSave(): void {
    if (this.formGroup.valid) {
      const entity = this.getEntityFromForm();
      this.sb._entityName_.create(entity);
    }
  }

  private addSubscriptions(): void {
    this.subscriptions.push(
      this.sb._entityName_.createState$.subscribe((state) => {
         this.handleFormBusyState(state);
        if (state.completed) {
          this.created.emit(true);
          this.notify.success('Successfully Created', 'Success');
          this.sb._entityName_.clearRequestState(RequestType.Create);
        }
      })
    );
  }
}

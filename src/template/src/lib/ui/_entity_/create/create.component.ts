import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormBaseComponent } from '@cartesianui/common';
import { _Library_Sandbox } from '../../../_library_.sandbox';
import { _Entity_ } from '../../../models';

@Component({
  selector: 'bo-create-_entity_-form',
  templateUrl: './create.component.html'
})
export class _Entity_CreateComponent extends FormBaseComponent<_Entity_> implements OnInit, OnDestroy {
  constructor(
    injector: Injector,
    private sb: _Library_Sandbox
  ) {
    super(injector, _Entity_);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.addSubscriptions();
  }

  private initializeForm() {
    this.formGroup = new this.entityConstructor({})?.form();
  }

  private addSubscriptions(): void {
    this.subscriptions.push(
      this.sb._entityName_CreationState$.subscribe(({ completed }) => {
        if (completed) {
          this.created.emit(true);
        }
      })
    );
  }

  save(): void {
    if (this.formGroup.valid) {
      const entity = this.createEntityFromForm(); // uses generic factory if provided
      this.sb.create_Entity_(entity);
    }
  }
}

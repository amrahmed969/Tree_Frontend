import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Injectable } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';

import { TreeService } from '../_service/tree.service';
import { treeNode } from '../_models/treeNode';

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  treeNodes: treeNode[];
  dataChange = new BehaviorSubject<treeNode[]>([]);
  get data(): treeNode[] {
    return this.dataChange.value;
  }

  constructor(private treeService: TreeService) {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    this.treeService.getTree().subscribe((res: any) => {
      this.treeNodes = res;
      const data = this.treeNodes.filter((x) => x.parent == null);

      console.log('roots', data);
      console.log('allnodes', this.treeNodes);
      // Notify the change.
      this.dataChange.next(data);
    });
  }

  getId() {
    var maxId: number = -Infinity;

    for (var i = 0; i < this.treeNodes.length; i++) {
      maxId = Math.max(this.treeNodes[i].Id);
    }

    console.log('getId', maxId + 1);

    return maxId + 1;
  }

  /** Add an item to to-do list */
  addRootNode(name: string) {
    var newNode: treeNode = new treeNode();

    newNode.Id = this.getId();
    newNode.parent = null!;
    newNode.level = 0;
    newNode.text = name;

    this.treeService.insertItem(newNode).subscribe();

    this.treeNodes.push(newNode);
    this.data.push(newNode);
    this.dataChange.next(this.data);
  }

  insertItem(parent: treeNode, name: string) {
    var newNode: treeNode = new treeNode();

    newNode.Id = this.getId();
    newNode.parent = parent.Id;
    newNode.level = parent.level + 1;
    newNode.text = name;

    this.treeNodes.push(newNode);
    this.dataChange.next(this.data);
  }

  updateItem(node: treeNode, name: string) {
    console.log(node);

    node.text = name;
    node.item = name;
    this.treeService.insertItem(node).subscribe();
    console.log(node);
    this.dataChange.next(this.data);
  }

  deleteItem(node: treeNode) {
    this.treeService.deleteNode(node.Id).subscribe();

    var indx = this.treeNodes.findIndex((x) => x.Id == node.Id);
    this.treeNodes.splice(indx, 1);

    if (node.parent == null) {
      var indx = this.data.findIndex((x) => x.Id == node.Id);
      this.data.splice(indx, 1);
    }

    this.dataChange.next(this.data);
  }

  updateNode(node: treeNode, itemValue: string) {
    node.text = itemValue;
    node.item = itemValue;

    this.treeService.updateNode(node).subscribe();
  }
}

/**
 * @title Tree with checkboxes
 */
@Component({
  selector: 'app-tree-checklist-example',
  templateUrl: './tree-checklist-example.component.html',
  styleUrls: ['./tree-checklist-example.component.css'],
  providers: [ChecklistDatabase],
})
export class TreeChecklistExampleComponent {
  /** The new item's name */
  newItemName = '';
  showForm: boolean = false;
  rootText: string;
  treeControl: FlatTreeControl<treeNode>;

  treeFlattener: MatTreeFlattener<treeNode, treeNode>;

  dataSource: MatTreeFlatDataSource<treeNode, treeNode>;

  constructor(private _database: ChecklistDatabase) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<treeNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    _database.dataChange.subscribe((data) => {
      this.dataSource.data = data;
    });
  }

  getLevel = (node: treeNode) => node.level;

  isExpandable = (node: treeNode) => {
    return this.hasChild(0, node);
  };
  getChildren = (node: treeNode): treeNode[] => {
    var childs = this._database.treeNodes.filter((x) => x.parent == node.Id);

    return childs;
  };
  hasChild = (_: number, _nodeData: treeNode) => {
    var childs = this.getChildren(_nodeData);

    if (childs.length > 0) return true;

    return false;
  };

  isLeafNode = (_: number, _nodeData: treeNode) => !this.hasChild(_, _nodeData);

  hasNoContent = (_: number, _nodeData: treeNode) => _nodeData.item === '';

  hasNoNodes = () => this._database.treeNodes.length <= 0

  

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: treeNode, level: number) => {
    if (node.parent == null) {
      node.level = 0;
    } else {
      var parent = this._database.treeNodes.find((x) => x.Id == node.parent);

      if (parent == undefined) node.level = 0;
      else node.level = parent.level + 1;
    }

    node.item = node.text;

    return node;
  };

  /** Select the category so we can insert the new item. */
  addNewItem(node: treeNode) {
    this._database.insertItem(node!, '');
    this.treeControl.expand(node);
  }
  //**update node in database */
  updateNode(node: treeNode, itemValue: string) {
    this._database.updateNode(node, itemValue);
    console.log(node, itemValue);
    node.edit = false;
  }

  deleteItem(node: treeNode) {
    // console.log(node);
    this._database.deleteItem(node!);
    // this.treeControl.expand(node);

    if (node.parent != null) {
      var parent = this._database.treeNodes.find((x) => x.Id == node.parent);

      this.treeControl.collapse(parent!);
      this.treeControl.expand(parent!);
    }
  }

  /** Save the node to database */
  saveNode(node: treeNode, itemValue: string) {
    if (itemValue == '') return;

    this._database.updateItem(node!, itemValue);

    var parent = this._database.treeNodes.find((x) => x.Id == node.parent);

    this.treeControl.collapse(parent!);
    this.treeControl.expand(parent!);
  }

  updateView(node: treeNode) {
    var parent = this._database.treeNodes.find((x) => x.Id == node.parent);

    if (parent?.parent == null) window.location.reload();

    this.treeControl.collapseAll();
    this.treeControl.expand(parent!);
  }

  addRootNode(text: string) {
    if (text == '' || text == undefined) return;

    console.log('addRootNode', text);

    this.showForm = false;
    this._database.addRootNode(text);
    // window.location.reload();
  }
  expandAll() {
    this.treeControl.expandAll();
  }
  collapseAll() {
    this.treeControl.collapseAll();
  }
}

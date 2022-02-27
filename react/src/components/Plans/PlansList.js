import React, { useState, useEffect } from "react";
import {
  Button,
  Header,
  Table,
} from "@awsui/components-react";
import { useCollection } from "@awsui/collection-hooks";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import { getPlans } from "./PlanService";
import EmptyState from "../Navigation/EmptyState";

const COLUMN_DEFINITIONS = [
  {
    id: "id",
    sortingField: "id",
    header: "Id",
    cell: (item) => item.id,
    width: 50,
  },
  {
    id: "name",
    sortingField: "name",
    header: "Name",
    cell: (item) => (
      <div>
        <Link to={`/plans/${item.id}`}>{item.name}</Link>
      </div>
    ),
    width: 50,
  },
  {
    id: "description",
    sortingField: "description",
    header: "Description",
    cell: (item) => item.description,
    width: 50,
  },
  {
    id: "quota",
    sortingField: "quota",
    header: "Quota",
    cell: (item) => item.quota,
    width: 50,
  },
  {
    id: "throttle",
    sortingField: "throttle",
    header: "Throttle",
    cell: (item) => item.throttle,
    width: 50,
  },
  {
    id: "price",
    sortingField: "price",
    header: "Price",
    cell: (item) => item.price,
    width: 50,
  },
];

export default function PlansList({user, setNotifications}) {
  const [plans, setPlans] = useState([]);
  const [preferences /*, setPreferences*/] = useState({
    visibleContent: ["name", "quota", "throttle", "price"],
    pageSize: 10,
  });
  const {
    items,
    actions,
    collectionProps /*, filteredItemsCount, filterProps, paginationProps */,
  } = useCollection(plans, {
    filtering: {
      empty: <EmptyState title="No Plans" subtitle="No plans to display" />,
      noMatch: (
        <EmptyState
          title="No matches"
          subtitle="Your search did not return any result"
          action={
            <Button onClick={() => actions.setFiltering("")}>
              Clear Filter
            </Button>
          }
        />
      ),
    },
    pagination: { pageSize: preferences.pageSize },
    sorting: {},
    selection: {},
  });
  const navigate = useNavigate();

  useEffect(() => {
    getPlans(user).then((items) => {
      setPlans(items);
    }).catch((reason) => console.error("getPlans() failed: ", reason));
  }, [user]);

  const { selectedItems } = collectionProps;

  function handlePurchase() {
    navigate(`/key/?plan=${selectedItems[0].id}`);
  }

  return (
    <Table
      {...collectionProps}
      columnDefinitions={COLUMN_DEFINITIONS}
      header={
        <Header
          counter={`(${plans.length})`}
          actions={
            <Button
              disabled={selectedItems.length === 0}
              variant="primary"
              onClick={handlePurchase}
            >
              Purchase Key
            </Button>
          }
        >
          Usage Plans
        </Header>
      }
      visibleColumns={preferences.visibleColumns}
      // filter={
      //   <TextFilter
      //     {...filterProps}
      //     filteringPlaceholder="Find Text..."
      //     countText={`${filteredItemsCount} matching plans`}
      //     >
      //   </TextFilter>
      // }
      // pagination={<Pagination {...paginationProps} />}
      // preferences={<TablePreferences
      //   preferences={preferences}
      //   setPreferences={setPreferences}
      // />}
      items={items}
      selectionType="single"
    ></Table>
  );
}

// function TablePreferences({}) {
//   return (
//     <CollectionPreferences>
//     </CollectionPreferences>
//   )
// }

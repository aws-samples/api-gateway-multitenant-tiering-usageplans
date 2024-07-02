import { unmarshall } from "@aws-sdk/util-dynamodb";
import { useCollection } from "@awsui/collection-hooks";
import {
  Button,
  CollectionPreferences,
  Header,
  Pagination,
  SpaceBetween,
  Table,
  TextFilter,
} from "@awsui/components-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import EmptyState from "../Navigation/EmptyState";
import { deleteKey, getKeys } from "./KeyService";

const COLUMN_DEFINITIONS = [
  {
    id: "id",
    sortingField: "id",
    header: "Id",
    cell: (item) => (
      <div>
        <Link to={`/key/${item.id}`}>{item.id}</Link>
      </div>
    ),
    width: 50,
  },
  {
    id: "name",
    sortingField: "name",
    header: "Name",
    cell: (item) => item.name,
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
    id: "planId",
    sortingField: "planId",
    header: "Plan ID",
    cell: (item) => item.planId,
    width: 50,
  },
  {
    id: "enabled",
    sortingField: "enabled",
    header: "Enabled",
    cell: (item) => (item.enabled ? "True" : "False"),
    width: 50,
  },
];

export default function KeysList({ user, setNotifications }) {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    visibleContent: ["name", "keyId", "enabled"],
    pageSize: 10,
  });
  const {
    items,
    actions,
    filteredItemsCount,
    collectionProps,
    filterProps,
    paginationProps,
  } = useCollection(allItems, {
    filtering: {
      empty: <EmptyState title="No Keys" subtitle="No keys to display" />,
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

  const { selectedItems } = collectionProps;

  useEffect(() => {
    setLoading(true);
    getKeys(user)
      .then((items) => {
        const convertedItems = items.map((item) => { 
          const unmarshalledItem = unmarshall(item);
          return {
            id: unmarshalledItem.id,
            name: unmarshalledItem.name,
            description: unmarshalledItem.description,
            planId: unmarshalledItem.planId,
            enabled: unmarshalledItem.enabled
          }
        })
        setAllItems(convertedItems);
      })
      .catch((reason) => console.error("getKeys() failed: ", reason))
      .finally(() => setLoading(false));
  }, [user]);

  function handleEdit() {
    console.log(selectedItems);
    navigate(`/key/${selectedItems[0].id}`);
  }

  function handleDelete() {
    const confirm = window.confirm(
      `Are you sure you wish to delete the API Key "${selectedItems[0].name}"?"`
    );
    if (!confirm) {
      return;
    }
    setLoading(true);
    setAllItems([]);
    deleteKey(user, selectedItems[0].id)
      .then(() => {
        return new Promise((resolve) => setTimeout(resolve, 5000));
      })
      .then(() => {
        console.log("Deleted Key");
        setNotifications([
          {
            type: "success",
            content: "Key deleted successfully.",
            dismissible: true,
            onDismiss: () => setNotifications([]),
          },
        ]);
        return getKeys(user);
      })
      .then((items) => {
        setAllItems(items);
      })
      .catch((reason) => console.error("deleteKey() failed: ", reason));

    setTimeout(() => {
      setLoading(true);
      getKeys(user)
        .then((items) => {
          setAllItems(items);
        })
        .catch((reason) => console.error("getKeys() failed: ", reason))
        .finally(() => setLoading(false));
    }, 5000);
  }

  function handlePurchase() {
    navigate("/key");
  }

  return (
    <Table
      {...collectionProps}
      columnDefinitions={COLUMN_DEFINITIONS}
      header={
        <Header
          counter={
            selectedItems.length
              ? `(${selectedItems.length}/${allItems.length})`
              : `(${allItems.length})`
          }
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                disabled={selectedItems.length === 0}
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                disabled={selectedItems.length === 0}
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                disabled={isLoading}
                variant="primary"
                onClick={handlePurchase}
              >
                Purchase
              </Button>
            </SpaceBetween>
          }
        >
          API Keys
        </Header>
      }
      loading={isLoading}
      loadingText="Loading Keys"
      visibleColumns={preferences.visibleColumns}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Find Text..."
          countText={`${filteredItemsCount} matching keys`}
        ></TextFilter>
      }
      pagination={<Pagination {...paginationProps} />}
      preferences={
        <TablePreferences
          preferences={preferences}
          setPreferences={setPreferences}
        />
      }
      items={items}
      selectionType="single"
    ></Table>
  );
}

function TablePreferences() {
  return <CollectionPreferences> </CollectionPreferences>;
}

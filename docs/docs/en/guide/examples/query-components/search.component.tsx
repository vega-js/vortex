import React from 'react';
import { Card } from '@components/card';
import { Input } from '@components/input';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';
import { debounce } from 'remeda';
import type { User } from './repo';
import UsersRepo from './repo';

const searchStore = defineStore(({ query, reactive, effect }) => {
  const usersRepo = new UsersRepo();
  const search = reactive('');

  const userQuery = query<User | null, void, string>((name) =>
    usersRepo.getUserByName(name),
  );
  const debouncedRunQuery = debounce(
    (searchValue: string) => {
      userQuery.run(searchValue);
    },
    { waitMs: 300 },
  );

  effect(() => {
    const searchValue = search.get();

    if (searchValue) {
      debouncedRunQuery.call(searchValue);
    }
  });

  const onSearch = (value: string) => search.set(value);

  return {
    search,
    userQuery,
    onSearch,
  };
});

const InputComponent = () => {
  const { search, onSearch } = useStore(searchStore);

  return (
    <Input
      placeholder='Search by name'
      value={search}
      onChange={(event) => onSearch(event.target.value)}
    />
  );
};

const SearchComponent = () => {
  const { userQuery } = useStore(searchStore);

  return (
    <Card>
      <RenderCount />
      <br />
      <InputComponent />
      {userQuery.isLoading && <Text>Searching...</Text>}
      {userQuery.data ? (
        <Text>
          User found: {userQuery.data.name}, Age: {userQuery.data.age}
        </Text>
      ) : (
        !userQuery.isLoading && <Text>User not found</Text>
      )}
    </Card>
  );
};

export default SearchComponent;

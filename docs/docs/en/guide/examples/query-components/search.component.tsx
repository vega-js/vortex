import React from 'react';
import { Card } from '@components/card';
import { Input } from '@components/input';
import { RenderCount } from '@components/render-count';
import { Text } from '@components/text';
import { defineStore, useStore } from '@vegajs/vortex';
import type { User } from './repo';
import UsersRepo from './repo';

const searchStore = defineStore(({ query, reactive, effect }) => {
  const usersRepo = new UsersRepo();
  const search = reactive('');

  const userQuery = query<User | null, void, string>((name) =>
    usersRepo.getUserByName(name),
  );

  effect(() => {
    const searchValue = search.get();

    if (searchValue) {
      userQuery.run(searchValue);
    }
  });

  const onSearch = (value: string) => search.set(value);

  return {
    search,
    userQuery,
    onSearch,
  };
});

const SearchComponent = () => {
  const { search, userQuery, onSearch } = useStore(searchStore);

  return (
    <Card>
      <RenderCount />
      <br />
      <Input
        placeholder='Search by name'
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      {userQuery.isLoading && <Text>Searching for {search}...</Text>}
      {userQuery.data ? (
        <Text>
          User found: {userQuery.data.name}, Age: {userQuery.data.age}
        </Text>
      ) : (
        search && !userQuery.isLoading && <Text>User not found</Text>
      )}
    </Card>
  );
};

export default SearchComponent;

/*******************************************************************************
 * Copyright (c) 2022, Customertimes Software
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import ChangeSetCreate, { DestructiveChangeSetMode, Changes } from './change-set/create';

interface CI {
  changeSet: {
    create: (
      headSha: string,
      baseSha: string,
      destructiveChangeSetMode: DestructiveChangeSetMode,
      changeSetDir: string,
      createRevertChangeSet: boolean,
      revertDestructiveChangeSetMode: DestructiveChangeSetMode,
      revertChangeSetDir: string,
    ) => Promise<Changes>;
  };
}

const ci: CI = {
  changeSet: {
    create: async (
      headSha: string,
      baseSha: string,
      destructiveChangeSetMode: DestructiveChangeSetMode,
      changeSetDir: string,
      createRevertChangeSet: boolean,
      revertDestructiveChangeSetMode: DestructiveChangeSetMode,
      revertChangeSetDir: string,
    ) =>
      await ChangeSetCreate(
        headSha,
        baseSha,
        destructiveChangeSetMode,
        changeSetDir,
        createRevertChangeSet,
        revertDestructiveChangeSetMode,
        revertChangeSetDir,
      ),
  },
};

export default ci;
